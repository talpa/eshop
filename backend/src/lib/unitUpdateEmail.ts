interface UnitUpdateEmailParams {
  unitName: string;
  title: string;
  content: string;
  shopUrl: string;
}

export const buildUnitUpdateEmail = (p: UnitUpdateEmailParams) => {
  const contentHtml = p.content
    .split('\n')
    .map(line => line.trim() ? `<p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6">${line}</p>` : '')
    .join('');

  const html = `<!DOCTYPE html>
<html lang="cs">
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
    <p style="margin:0 0 6px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">Aktualita jednotky</p>
    <p style="margin:0 0 4px;color:#0c1f44;font-size:14px;font-weight:600">${p.unitName}</p>
    <h2 style="margin:0 0 20px;color:#1e293b;font-size:20px;font-weight:700">${p.title}</h2>
    ${contentHtml}

    <div style="margin-top:28px;text-align:center">
      <a href="${p.shopUrl}" style="display:inline-block;background:#1e3a6e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Navštívit eshop
      </a>
    </div>

    <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6">
      Tuto zprávu dostáváte, protože jste podpořili jednotku <strong>${p.unitName}</strong> prostřednictvím nadačního fondu Česká stopa.<br>
      Pro odhlášení z budoucích aktualit nás prosím kontaktujte na info@fondceskestopy.eu.
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

  const text = `${p.unitName} – ${p.title}

${p.content}

---
Tuto zprávu dostáváte, protože jste podpořili jednotku ${p.unitName} prostřednictvím nadačního fondu Česká stopa.
Pro odhlášení kontaktujte info@fondceskestopy.eu

Česká stopa – Nadační fond`;

  return { subject: `Aktualita: ${p.title} — ${p.unitName}`, html, text };
};
