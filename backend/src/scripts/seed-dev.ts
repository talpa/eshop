import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Kategorie
    const cats = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'elektronika' },
        update: {},
        create: { name: 'Elektronika', slug: 'elektronika', description: 'Telefony, notebooky, příslušenství' },
      }),
      prisma.category.upsert({
        where: { slug: 'obleceni' },
        update: {},
        create: { name: 'Oblečení', slug: 'obleceni', description: 'Trička, mikiny, kalhoty' },
      }),
      prisma.category.upsert({
        where: { slug: 'knihy' },
        update: {},
        create: { name: 'Knihy', slug: 'knihy', description: 'Beletrie, odborná literatura, komiksy' },
      }),
      prisma.category.upsert({
        where: { slug: 'domacnost' },
        update: {},
        create: { name: 'Domácnost', slug: 'domacnost', description: 'Nádobí, dekorace, nábytek' },
      }),
    ]);

    console.log('✓ Kategorie:', cats.map(c => c.name).join(', '));

    const [elektronika, obleceni, knihy, domacnost] = cats;

    // Produkty
    const products = [
      { name: 'Bezdrátová sluchátka ProSound X3', slug: 'bezdratova-sluchatka-prosound-x3', priceCzk: 1290, stock: 15, categoryId: elektronika.id, description: 'Aktivní potlačení hluku, výdrž 30h, Bluetooth 5.3' },
      { name: 'USB-C nabíječka 65W GaN', slug: 'usb-c-nabijecka-65w-gan', priceCzk: 590, stock: 42, categoryId: elektronika.id, description: 'Kompaktní GaN nabíječka, rychlé nabíjení, 2× USB-C + 1× USB-A' },
      { name: 'Mechanická klávesnice Tactile 87', slug: 'mechanicka-klavesnice-tactile-87', priceCzk: 2190, stock: 8, categoryId: elektronika.id, description: 'TKL layout, Cherry MX Brown přepínače, RGB podsvícení' },
      { name: 'Webkamera FullHD AutoFocus', slug: 'webkamera-fullhd-autofocus', priceCzk: 890, stock: 0, categoryId: elektronika.id, description: '1080p/30fps, autofokus, vestavěný mikrofon s potlačením šumu' },

      { name: 'Bavlněné tričko Basic černé', slug: 'bavlnene-tricko-basic-cerne', priceCzk: 299, stock: 120, categoryId: obleceni.id, description: '100% bavlna, unisex střih, dostupné ve všech velikostech' },
      { name: 'Mikina s kapucí Comfort šedá', slug: 'mikina-s-kapuci-comfort-seda', priceCzk: 799, stock: 35, categoryId: obleceni.id, description: 'Fleece podšívka, zip, boční kapsy' },
      { name: 'Funkční ponožky SportDry 3-pack', slug: 'funkcni-ponozky-sportdry-3-pack', priceCzk: 249, stock: 200, categoryId: obleceni.id, description: 'Odvod vlhkosti, anatomický tvar, velikosti 38–46' },

      { name: 'Čistý kód – Robert C. Martin', slug: 'cisty-kod-robert-c-martin', priceCzk: 549, stock: 12, categoryId: knihy.id, description: 'Klasika softwarového řemesla. Jak psát kód, který radost číst.' },
      { name: 'Pragmatický programátor', slug: 'pragmaticky-programator', priceCzk: 499, stock: 7, categoryId: knihy.id, description: 'Hunt & Thomas – nadčasové rady pro každého vývojáře.' },
      { name: 'Duna – Frank Herbert', slug: 'duna-frank-herbert', priceCzk: 349, stock: 25, categoryId: knihy.id, description: 'Kultovní sci-fi román, kompletní první díl.' },

      { name: 'Bambusové prkénko na krájení L', slug: 'bambusove-prkenco-na-krajeni-l', priceCzk: 399, stock: 30, categoryId: domacnost.id, description: '40×28 cm, ekologický bambus, drážka pro šťávu' },
      { name: 'Sada keramických hrnků 4ks', slug: 'sada-keramickych-hrnku-4ks', priceCzk: 649, stock: 18, categoryId: domacnost.id, description: 'Objem 330ml, matná glazura, myčka odolné' },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: { stock: p.stock, priceCzk: p.priceCzk },
        create: { ...p, images: [] },
      });
    }

    console.log(`✓ Produkty: ${products.length} kusů`);
    console.log('Seed dokončen.');
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
