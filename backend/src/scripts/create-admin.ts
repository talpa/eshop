import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = 'talpa@suchdol.net';
  const name = 'Talpa Admin';
  const password = 'Eshop2026!';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      console.log('✓ Existující uživatel povýšen na ADMIN:', email);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: { email, name, passwordHash, role: 'ADMIN' },
      });
      console.log('✓ Admin vytvořen:', email);
      console.log('  Heslo:', password);
      console.log('  ⚠ Změň heslo po prvním přihlášení!');
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
