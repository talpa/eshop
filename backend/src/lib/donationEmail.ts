import { Order, OrderItem, MilitaryUnit } from '@prisma/client';

type OrderWithDetails = Order & {
  items: (OrderItem & { product?: { name: string } | null })[];
  militaryUnit: MilitaryUnit | null;
};

export const buildDonationConfirmationEmail = (order: OrderWithDetails): { subject: string; html: string; text: string } => {
  const amount = Number(order.donationAmount).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });
  const unitName = order.militaryUnit?.name || 'vybranou vojenskou jednotku';
  const date = new Date(order.createdAt).toLocaleDateString('cs-CZ');
  const itemsList = order.items
    .map(i => `<li>${i.productName} × ${i.quantity}</li>`)
    .join('');
  const itemsText = order.items.map(i => `- ${i.productName} × ${i.quantity}`).join('\n');

  const subject = `Potvrzení daru #${order.variableSymbol} – děkujeme!`;

  const html = `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; }
  .header { background: #1e3a5f; color: white; padding: 24px; text-align: center; }
  .content { padding: 24px; }
  .amount { font-size: 2rem; font-weight: bold; color: #1e3a5f; text-align: center; margin: 16px 0; }
  .box { background: #f4f6f9; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .label { font-size: 0.8rem; color: #666; }
  .footer { background: #f0f0f0; padding: 16px; font-size: 0.8rem; color: #666; text-align: center; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0">Potvrzení o daru</h1>
    <p style="margin:8px 0 0">Česká stopa</p>
  </div>
  <div class="content">
    <p>Vážený/á ${order.customerName},</p>
    <p>srdečně Vám děkujeme za Váš dar na podporu <strong>${unitName}</strong>.</p>

    <div class="amount">${amount}</div>

    <div class="box">
      <p class="label">ČÍSLO DARU</p>
      <p style="margin:4px 0; font-family: monospace; font-size: 1.1rem">${order.variableSymbol}</p>
      <p class="label" style="margin-top:12px">DATUM</p>
      <p style="margin:4px 0">${date}</p>
      <p class="label" style="margin-top:12px">VOJENSKÁ JEDNOTKA</p>
      <p style="margin:4px 0">${unitName}</p>
    </div>

    <p>Jako poděkování za Váš dar Vám zašleme:</p>
    <ul>${itemsList}</ul>

    <p>Toto potvrzení slouží jako doklad o poskytnutém daru pro daňové účely. Dar byl poskytnut dobrovolně bez nároku na protiplnění.</p>

    <p>Děkujeme, že podporujete naše vojáky!</p>
  </div>
  <div class="footer">
    <p>Potvrzení o daru č. ${order.variableSymbol} | ${date}</p>
    <p>Pro opakované stažení potvrzení se přihlaste na našich stránkách.</p>
  </div>
</body>
</html>`;

  const text = `
Potvrzení o daru – Česká stopa
================================
Vážený/á ${order.customerName},

děkujeme za Váš dar ve výši ${amount} na podporu ${unitName}.

Číslo daru: ${order.variableSymbol}
Datum: ${date}
Jednotka: ${unitName}

Jako poděkování Vám zašleme:
${itemsText}

Toto potvrzení slouží jako doklad o poskytnutém daru pro daňové účely.
`.trim();

  return { subject, html, text };
};
