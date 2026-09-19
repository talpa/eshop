import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eshop.cz';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: UserRole.ADMIN,
      },
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    const electronics = await prisma.category.create({
      data: { name: 'Elektronika', slug: 'elektronika', description: 'Elektronika a gadgety' },
    });
    const clothing = await prisma.category.create({
      data: { name: 'Oblečení', slug: 'obleceni', description: 'Módní oblečení' },
    });

    await prisma.product.createMany({
      data: [
        {
          name: 'Bezdrátová sluchátka',
          slug: 'bezdratova-sluchatka',
          description: 'Pohodlná bezdrátová sluchátka s ANC technologií.',
          priceCzk: 1990,
          stock: 15,
          isActive: true,
          categoryId: electronics.id,
        },
        {
          name: 'Chytrý náramek',
          slug: 'chytry-naramek',
          description: 'Fitness náramek s monitorem tepu a spánku.',
          priceCzk: 890,
          stock: 30,
          isActive: true,
          categoryId: electronics.id,
        },
        {
          name: 'Bavlněné tričko',
          slug: 'bavlnene-tricko',
          description: '100% bavlna, unisex střih, dostupné ve více barvách.',
          priceCzk: 299,
          stock: 100,
          isActive: true,
          categoryId: clothing.id,
        },
      ],
    });
    console.log('Sample categories and products created');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
