import PDFDocument from 'pdfkit';
import { Order, OrderItem, MilitaryUnit } from '@prisma/client';
import { Response } from 'express';

type OrderWithDetails = Order & {
  items: (OrderItem & { product?: { name: string } | null })[];
  militaryUnit: MilitaryUnit | null;
};

const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const BRAND_BLUE = '#1e3a5f';
const LIGHT_GRAY = '#f4f6f9';
const TEXT_GRAY = '#555555';

const formatCzk = (amount: number) =>
  amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';

const formatDate = (date: Date) =>
  date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const generateDonationPdf = (order: OrderWithDetails, res: Response): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="potvrzeni-daru-${order.variableSymbol}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width;
  const margin = 50;
  const contentW = pageW - margin * 2;

  // Header background
  doc.rect(0, 0, pageW, 90).fill(BRAND_BLUE);

  doc.font(FONT_BOLD).fontSize(22).fillColor('#ffffff');
  doc.text('POTVRZENÍ O PŘIJETÍ DARU', margin, 28);

  doc.font(FONT_REGULAR).fontSize(11).fillColor('#aac4e0');
  doc.text('na pomoc Ukrajině', margin, 56);

  doc.moveDown(3);

  // Subtitle row
  doc.font(FONT_BOLD).fontSize(12).fillColor(BRAND_BLUE);
  doc.text('Darovací smlouva', margin, 110);

  doc.font(FONT_REGULAR).fontSize(10).fillColor(TEXT_GRAY);
  doc.text(`č. ${order.variableSymbol}`, margin, 126);

  // Info box
  const boxY = 148;
  doc.rect(margin, boxY, contentW, 110).fill(LIGHT_GRAY);

  doc.font(FONT_BOLD).fontSize(9).fillColor(TEXT_GRAY);
  const col2 = margin + contentW / 2;

  doc.text('DÁRCE', margin + 12, boxY + 12);
  doc.font(FONT_REGULAR).fontSize(10).fillColor('#111');
  doc.text(order.customerName, margin + 12, boxY + 24);
  doc.font(FONT_REGULAR).fontSize(9).fillColor(TEXT_GRAY);
  doc.text(order.customerEmail, margin + 12, boxY + 38);
  const addressDisplay = order.shippingAddress
    || [order.street, order.city, order.zip].filter(Boolean).join(', ')
    || '—';
  doc.text(addressDisplay, margin + 12, boxY + 52, { width: contentW / 2 - 24 });

  doc.font(FONT_BOLD).fontSize(9).fillColor(TEXT_GRAY);
  doc.text('DATUM DARU', col2, boxY + 12);
  doc.font(FONT_REGULAR).fontSize(10).fillColor('#111');
  doc.text(formatDate(order.createdAt), col2, boxY + 24);

  doc.font(FONT_BOLD).fontSize(9).fillColor(TEXT_GRAY);
  doc.text('VOJENSKÁ JEDNOTKA', col2, boxY + 52);
  doc.font(FONT_REGULAR).fontSize(10).fillColor('#111');
  doc.text(order.militaryUnit?.name || 'Neuvedena', col2, boxY + 64);

  // Donation amount highlight
  const amountY = boxY + 125;
  doc.rect(margin, amountY, contentW, 48).fill(BRAND_BLUE);
  doc.font(FONT_REGULAR).fontSize(10).fillColor('#aac4e0');
  doc.text('VÝŠE DARU', margin + 16, amountY + 9);
  doc.font(FONT_BOLD).fontSize(20).fillColor('#ffffff');
  doc.text(formatCzk(Number(order.donationAmount)), margin + 16, amountY + 22);

  // Items section
  const itemsY = amountY + 68;
  doc.font(FONT_BOLD).fontSize(10).fillColor(BRAND_BLUE);
  doc.text('Jako poděkování dárce obdrží:', margin, itemsY);

  let rowY = itemsY + 16;
  for (const item of order.items) {
    doc.font(FONT_REGULAR).fontSize(9).fillColor('#333');
    doc.text(`• ${item.productName}`, margin + 8, rowY, { continued: true });
    doc.text(`  × ${item.quantity}`, { align: 'left' });
    rowY += 16;
  }

  // Separator line
  rowY += 8;
  doc.moveTo(margin, rowY).lineTo(margin + contentW, rowY).stroke('#dddddd');
  rowY += 12;

  // Legal text
  doc.font(FONT_REGULAR).fontSize(8).fillColor(TEXT_GRAY);
  const legal = [
    'Toto potvrzení osvědčuje, že dárce výše uvedeného dne poskytl dobrovolný peněžitý dar',
    'bez nároku na jakékoliv protiplnění, s výjimkou poděkování uvedeného výše.',
    'Dar byl přijat a bude využit výhradně na pomoc uvedené vojenské jednotce a/nebo',
    'na nákupy materiálu a vybavení pro potřeby této jednotky.',
    'Doklad je platný bez podpisu a razítka jako elektronicky generované potvrzení o daru.',
  ];
  for (const line of legal) {
    doc.text(line, margin, rowY, { width: contentW });
    rowY += 12;
  }

  // Footer
  const footerY = doc.page.height - 50;
  doc.rect(0, footerY - 10, pageW, 60).fill(LIGHT_GRAY);
  doc.font(FONT_REGULAR).fontSize(8).fillColor(TEXT_GRAY);
  doc.text(
    `Vygenerováno: ${formatDate(new Date())}  |  VS: ${order.variableSymbol}  |  Dokument ke stažení kdykoliv po přihlášení`,
    margin,
    footerY + 2,
    { width: contentW, align: 'center' }
  );

  doc.end();
};
