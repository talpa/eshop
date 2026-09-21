import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const confirmed = process.argv.includes('--confirm');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Count what will be deleted
    const [
      unitUpdateCount,
      orderCount,
      paymentCount,
      orderItemCount,
      newsletterCount,
      customerCount,
    ] = await Promise.all([
      prisma.unitUpdate.count(),
      prisma.order.count(),
      prisma.payment.count(),
      prisma.orderItem.count(),
      prisma.newsletterSubscriber.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    // Count what will be preserved
    const [
      activityCount,
      categoryCount,
      unitCount,
      adminCount,
    ] = await Promise.all([
      prisma.activity.count(),
      prisma.category.count(),
      prisma.militaryUnit.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    const productCount = await prisma.product.count();

    console.log('\n=== PRODUKČNÍ ČIŠTĚNÍ DATABÁZE ===\n');
    console.log('Bude SMAZÁNO:');
    console.log(`  UnitUpdate:            ${unitUpdateCount}`);
    console.log(`  Order:                 ${orderCount}`);
    console.log(`  Payment (cascade):     ${paymentCount}`);
    console.log(`  OrderItem (cascade):   ${orderItemCount}`);
    console.log(`  NewsletterSubscriber:  ${newsletterCount}`);
    console.log(`  User (CUSTOMER):       ${customerCount}`);
    console.log(`  Product:               ${productCount}`);
    console.log('');
    console.log('Bude ZACHOVÁNO:');
    console.log(`  Activity:              ${activityCount}`);
    console.log(`  Category:              ${categoryCount}`);
    console.log(`  MilitaryUnit:          ${unitCount}`);
    console.log(`  User (ADMIN):          ${adminCount}`);
    console.log('');

    if (!confirmed) {
      console.log('⚠  Spusť s --confirm pro skutečné smazání:');
      console.log('   npx ts-node src/scripts/cleanup-prod-db.ts --confirm');
      console.log('');
      return;
    }

    console.log('Mažu data...');

    await prisma.$transaction(async (tx) => {
      const u = await tx.unitUpdate.deleteMany();
      console.log(`  ✓ UnitUpdate:            ${u.count}`);

      // Order cascade-deletes Payment and OrderItem
      const o = await tx.order.deleteMany();
      console.log(`  ✓ Order + cascade:       ${o.count} objednávek`);

      const n = await tx.newsletterSubscriber.deleteMany();
      console.log(`  ✓ NewsletterSubscriber:  ${n.count}`);

      const c = await tx.user.deleteMany({ where: { role: 'CUSTOMER' } });
      console.log(`  ✓ User (CUSTOMER):       ${c.count}`);

      // Products can be deleted now — OrderItems are already gone via cascade
      const p = await tx.product.deleteMany();
      console.log(`  ✓ Product:               ${p.count}`);
    });

    console.log('\n✓ Hotovo — číselníky a admini zachováni.');
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
