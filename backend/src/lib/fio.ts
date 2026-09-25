interface FioTransaction {
  transactionId: string;
  amount: number;
  currency: string;
  variableSymbol?: string;
  message?: string;
  date?: string;
}

const FIO_BASE_URL = 'https://fioapi.fio.cz/v1/rest';

// FIO enforces a 30-second rate limit per token. Enforce a stricter
// 2-minute minimum to stay well clear of it across all callers.
const FIO_MIN_INTERVAL_MS = 2 * 60 * 1000;
let lastFioCallAt = 0;

export class FioRateLimitedError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Fio API rate limit — retry in ${Math.ceil(retryAfterMs / 1000)} s`);
    this.name = 'FioRateLimitedError';
    this.retryAfterMs = retryAfterMs;
  }
}

const assertNotRateLimited = (): void => {
  const elapsed = Date.now() - lastFioCallAt;
  if (elapsed < FIO_MIN_INTERVAL_MS) {
    throw new FioRateLimitedError(FIO_MIN_INTERVAL_MS - elapsed);
  }
  lastFioCallAt = Date.now();
};

const markFioCallForced = (): void => {
  lastFioCallAt = Date.now();
};

const normaliseFioDate = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  const withT = raw.replace(/^(\d{4}-\d{2}-\d{2})([+-])(\d{2})(\d{2})$/, '$1T00:00:00$2$3:$4');
  if (withT !== raw) return withT;
  return raw.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-])(\d{2})(\d{2})$/, '$1$2$3:$4');
};

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const pick = (obj: Record<string, unknown>, key: string): string | undefined => {
  const value = obj[key];
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const assertJsonResponse = async (response: Response, requestedUrl: string): Promise<void> => {
  if (response.url && !response.url.startsWith('https://fioapi.fio.cz/')) {
    throw new Error(`Fio API redirected — token is invalid or missing.`);
  }
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) return;
  const body = await response.text();
  const preview = body.slice(0, 300).replace(/\s+/g, ' ').trim();
  if (!response.ok) throw new Error(`Fio API HTTP ${response.status} at ${requestedUrl}. Body: ${preview}`);
  throw new Error(`Fio API returned HTML — token is likely invalid. URL: ${requestedUrl}`);
};

export const fetchFioTransactions = async (
  fromDate: Date,
  toDate: Date,
  options?: { force?: boolean }
): Promise<FioTransaction[]> => {
  const token = (process.env.FIO_API_TOKEN || '').trim().replace(/^['"]|['"]$/g, '');
  if (!token) return [];

  if (options?.force) {
    markFioCallForced();
  } else {
    assertNotRateLimited();
  }

  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  const encodedToken = encodeURIComponent(token);
  const url = `${FIO_BASE_URL}/periods/${encodedToken}/${fmt(fromDate)}/${fmt(toDate)}/transactions.json`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (response.status === 409) throw new FioRateLimitedError(30000);

  await assertJsonResponse(response, url);

  const data = (await response.json()) as Record<string, unknown>;
  const listRoot = (data.accountStatement as Record<string, unknown> | undefined)?.transactionList as Record<string, unknown> | undefined;
  const tx = toArray(listRoot?.transaction as Record<string, unknown>[] | Record<string, unknown> | undefined);

  return tx.map((item) => {
    const columns = Object.values(item).filter(
      (v): v is Record<string, unknown> => v !== null && typeof v === 'object'
    );
    const lookup: Record<string, string> = {};
    for (const col of columns) {
      const name = pick(col, 'name') || pick(col, 'id');
      const value = pick(col, 'value');
      if (name && value) lookup[name] = value;
    }
    const rawAmount = lookup['Objem'] || lookup['amount'] || '0';
    const normalizedAmount = Number(String(rawAmount).replace(',', '.'));
    return {
      transactionId: lookup['ID pohybu'] || lookup['id'] || '',
      amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      currency: lookup['Měna'] || lookup['currency'] || 'CZK',
      variableSymbol: lookup['VS'] || lookup['variableSymbol'],
      message: lookup['Zpráva pro příjemce'] || lookup['Popis'] || lookup['message'],
      date: normaliseFioDate(lookup['Datum'] || lookup['date']),
    };
  });
};

export const generateQrPayload = (
  iban: string,
  amountCzk: number,
  variableSymbol: string,
  message: string
): string => {
  return `SPD*1.0*ACC:${iban}*AM:${amountCzk.toFixed(2)}*CC:CZK*MSG:${message}*X-VS:${variableSymbol}`;
};

export const generateVariableSymbol = (): string => {
  const ts = Date.now().toString().slice(-7);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return ts + rand;
};
