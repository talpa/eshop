interface UnitUpdateEmailParams {
  unitName: string;
  title: string;
  titleEn?: string | null;
  titleUk?: string | null;
  titleDe?: string | null;
  content: string;
  contentEn?: string | null;
  contentUk?: string | null;
  contentDe?: string | null;
  shopUrl: string;
  lang?: string;
}

function pick(lang: string, cs: string, en?: string | null, uk?: string | null, de?: string | null): string {
  if (lang === 'en' && en) return en;
  if (lang === 'uk' && uk) return uk;
  if (lang === 'de' && de) return de;
  return cs;
}

const UI: Record<string, { label: string; cta: string; received: string; unsubscribe: string }> = {
  cs: {
    label: 'Aktualita jednotky',
    cta: 'Navštívit eshop',
    received: 'Tuto zprávu dostáváte, protože jste podpořili jednotku',
    unsubscribe: 'Pro odhlášení z budoucích aktualit nás prosím kontaktujte na info@fondceskestopy.eu.',
  },
  en: {
    label: 'Unit update',
    cta: 'Visit the shop',
    received: 'You receive this message because you supported the unit',
    unsubscribe: 'To unsubscribe from future updates, please contact us at info@fondceskestopy.eu.',
  },
  uk: {
    label: 'Оновлення підрозділу',
    cta: 'Відвідати магазин',
    received: 'Ви отримуєте цей лист, оскільки підтримали підрозділ',
    unsubscribe: 'Щоб відписатися від майбутніх оновлень, зв\'яжіться з нами: info@fondceskestopy.eu.',
  },
  de: {
    label: 'Neuigkeit der Einheit',
    cta: 'Shop besuchen',
    received: 'Sie erhalten diese Nachricht, weil Sie die Einheit unterstützt haben',
    unsubscribe: 'Um sich von zukünftigen Updates abzumelden, kontaktieren Sie uns: info@fondceskestopy.eu.',
  },
};

const SUBJECTS: Record<string, (t: string, u: string) => string> = {
  cs: (t, u) => `Aktualita: ${t} — ${u}`,
  en: (t, u) => `Update: ${t} — ${u}`,
  uk: (t, u) => `Оновлення: ${t} — ${u}`,
  de: (t, u) => `Neuigkeit: ${t} — ${u}`,
};

export const buildUnitUpdateEmail = (p: UnitUpdateEmailParams) => {
  const lang = (p.lang && UI[p.lang]) ? p.lang : 'cs';
  const ui = UI[lang];
  const title = pick(lang, p.title, p.titleEn, p.titleUk, p.titleDe);
  const content = pick(lang, p.content, p.contentEn, p.contentUk, p.contentDe);

  const contentHtml = content
    .split('\n')
    .map(line => line.trim() ? `<p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6">${line}</p>` : '')
    .join('');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <tr><td style="background:#0c1f44;border-radius:12px 12px 0 0;padding:32px;text-align:center">
    <p style="margin:0 0 4px;color:#93c5fd;font-size:13px;letter-spacing:1px;text-transform:uppercase">Nadační fond</p>
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Česká stopa</h1>
  </td></tr>

  <tr><td style="background:#ffffff;padding:32px">
    <p style="margin:0 0 6px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">${ui.label}</p>
    <p style="margin:0 0 4px;color:#0c1f44;font-size:14px;font-weight:600">${p.unitName}</p>
    <h2 style="margin:0 0 20px;color:#1e293b;font-size:20px;font-weight:700">${title}</h2>
    ${contentHtml}

    <div style="margin-top:28px;text-align:center">
      <a href="${p.shopUrl}" style="display:inline-block;background:#1e3a6e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        ${ui.cta}
      </a>
    </div>

    <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6">
      ${ui.received} <strong>${p.unitName}</strong> prostřednictvím nadačního fondu Česká stopa.<br>
      ${ui.unsubscribe}
    </p>
  </td></tr>

  <tr><td style="background:#0c1f44;border-radius:0 0 12px 12px;padding:20px;text-align:center">
    <p style="margin:0;color:#64748b;font-size:12px">© ${new Date().getFullYear()} Česká stopa — Nadační fond na pomoc Ukrajině</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `${p.unitName} – ${title}\n\n${content}\n\n---\n${ui.received} ${p.unitName} prostřednictvím nadačního fondu Česká stopa.\n${ui.unsubscribe}\n\nČeská stopa – Nadační fond`;

  const subject = (SUBJECTS[lang] || SUBJECTS.cs)(title, p.unitName);
  return { subject, html, text };
};
