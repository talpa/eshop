interface OrderCreatedEmailParams {
  customerName: string;
  customerEmail: string;
  variableSymbol: string;
  donationAmount: number;
  totalCzk: number;
  unitName?: string;
  accountNumber?: string;
  iban?: string;
  orderUrl: string;
  items: { productName: string; quantity: number }[];
}

export const buildOrderCreatedEmail = (p: OrderCreatedEmailParams) => {
  const amountStr = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(p.donationAmount);
  const minStr = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(p.totalCzk);

  const itemsHtml = p.items.map(i =>
    `<tr><td style="padding:4px 0;color:#475569">${i.productName}</td><td style="padding:4px 0;text-align:right;color:#475569">× ${i.quantity}</td></tr>`
  ).join('');

  const accountRows = [
    p.accountNumber ? `<tr><td style="padding:5px 0;color:#64748b;font-size:14px">Číslo účtu</td><td style="padding:5px 0;font-weight:bold;font-size:14px;font-family:monospace">${p.accountNumber}</td></tr>` : '',
    p.iban ? `<tr><td style="padding:5px 0;color:#64748b;font-size:14px">IBAN</td><td style="padding:5px 0;font-weight:bold;font-size:14px;font-family:monospace">${p.iban}</td></tr>` : '',
    `<tr><td style="padding:5px 0;color:#64748b;font-size:14px">Variabilní symbol</td><td style="padding:5px 0;font-weight:bold;font-size:18px;color:#1e3a6e;font-family:monospace">${p.variableSymbol}</td></tr>`,
    `<tr><td style="padding:5px 0;color:#64748b;font-size:14px">Částka</td><td style="padding:5px 0;font-weight:bold;font-size:18px;color:#2563eb">${amountStr}</td></tr>`,
  ].filter(Boolean).join('');

  const html = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr><td style="background:#0c1f44;border-radius:12px 12px 0 0;padding:32px;text-align:center">
    <p style="margin:0 0 4px;color:#93c5fd;font-size:13px;letter-spacing:1px;text-transform:uppercase">Nadační fond</p>
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Česká stopa</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:32px">
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px">Vážený/á <strong>${p.customerName}</strong>,</p>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
      děkujeme za vytvoření darovací smlouvy${p.unitName ? ` pro <strong>${p.unitName}</strong>` : ''}.
      Pro dokončení daru prosím proveďte platbu s níže uvedenými údaji.
    </p>

    <!-- Platební instrukce -->
    <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#0c1f44;text-transform:uppercase;letter-spacing:0.5px">Platební instrukce</p>
      <table width="100%" cellpadding="0" cellspacing="0">${accountRows}</table>
    </div>

    <!-- Dárky -->
    <div style="margin-bottom:24px">
      <p style="margin:0 0 10px;font-weight:600;font-size:14px;color:#1e293b">Jako poděkování obdržíte:</p>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8">Minimální výše daru: ${minStr}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px">
      <a href="${p.orderUrl}" style="display:inline-block;background:#1e3a6e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Zobrazit darovací smlouvu s QR kódem
      </a>
    </div>

    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
      Po přijetí platby Vám bude automaticky odesláno potvrzení o přijetí daru ve formátu PDF.<br>
      Variabilní symbol slouží k párování platby — prosím nevynechejte ho.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0c1f44;border-radius:0 0 12px 12px;padding:20px;text-align:center">
    <p style="margin:0;color:#64748b;font-size:12px">© ${new Date().getFullYear()} Česká stopa — Nadační fond na pomoc Ukrajině</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Darovací smlouva – Česká stopa

Vážený/á ${p.customerName},

děkujeme za vytvoření darovací smlouvy${p.unitName ? ` pro ${p.unitName}` : ''}.

PLATEBNÍ INSTRUKCE:
${p.accountNumber ? `Číslo účtu: ${p.accountNumber}\n` : ''}${p.iban ? `IBAN: ${p.iban}\n` : ''}Variabilní symbol: ${p.variableSymbol}
Částka: ${amountStr}

Jako poděkování obdržíte:
${p.items.map(i => `- ${i.productName} × ${i.quantity}`).join('\n')}

Po přijetí platby Vám bude odesláno potvrzení o daru (PDF).

Zobrazit darovací smlouvu: ${p.orderUrl}

Česká stopa – Nadační fond`;

  return { to: p.customerEmail, subject: `Darovací smlouva #${p.variableSymbol} – Česká stopa`, html, text };
};
