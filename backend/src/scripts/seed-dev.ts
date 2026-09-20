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
        where: { slug: 'sevrony-odznaky' },
        update: {},
        create: { name: 'Ševrony a odznaky', slug: 'sevrony-odznaky', description: 'Nášivky, ševrony a bojové odznaky jednotek' },
      }),
      prisma.category.upsert({
        where: { slug: 'vlajky' },
        update: {},
        create: { name: 'Vlajky', slug: 'vlajky', description: 'Vlajky České republiky, Ukrajiny a vojenských jednotek' },
      }),
      prisma.category.upsert({
        where: { slug: 'obleceni' },
        update: {},
        create: { name: 'Oblečení', slug: 'obleceni', description: 'Trička, mikiny a kšiltovky s motivem České stopy' },
      }),
      prisma.category.upsert({
        where: { slug: 'hrnecky-darky' },
        update: {},
        create: { name: 'Hrnečky a dárky', slug: 'hrnecky-darky', description: 'Hrnečky, termohrnky a ručně vyráběné dárky' },
      }),
    ]);

    console.log('✓ Kategorie:', cats.map(c => c.name).join(', '));

    const [sevrony, vlajky, obleceni, hrnecky] = cats;

    // Vojenské jednotky
    const units = await Promise.all([
      prisma.militaryUnit.upsert({
        where: { slug: '4-brigada-rychleho-nasazeni' },
        update: {},
        create: {
          name: '4. brigáda rychlého nasazení',
          slug: '4-brigada-rychleho-nasazeni',
          description: 'Elitní jednotka AČR nasazená na podporu Ukrajiny. Specializuje se na rychlé operace a logistickou podporu.',
          isActive: true,
        },
      }),
      prisma.militaryUnit.upsert({
        where: { slug: '102-przkumny-prapor' },
        update: {},
        create: {
          name: '102. průzkumný prapor',
          slug: '102-przkumny-prapor',
          description: 'Zpravodajská a průzkumná jednotka operující v obtížném terénu. Zajišťuje kritické informace pro spojenecké síly.',
          isActive: true,
        },
      }),
      prisma.militaryUnit.upsert({
        where: { slug: '53-protiletadlovy-raketovy-pluk' },
        update: {},
        create: {
          name: '53. protiletadlový raketový pluk',
          slug: '53-protiletadlovy-raketovy-pluk',
          description: 'Zajišťuje protiletadlovou obranu. Obsluha systémů SHORAD a MANPADS pro ochranu civilního obyvatelstva.',
          isActive: true,
        },
      }),
    ]);

    console.log('✓ Vojenské jednotky:', units.map(u => u.name).join(', '));

    // Produkty
    const products = [
      // Ševrony a odznaky
      {
        name: 'Ševrón Česká stopa – vyšívaný',
        slug: 'sevron-ceska-stopa-vysivany',
        priceCzk: 290,
        stock: 100,
        categoryId: sevrony.id,
        description: 'Vyšívaný rukávový ševrón s logem České stopy. Rozměr 9×7 cm, suchý zip na zadní straně. Vhodný na uniformu i batoh.',
        images: ['https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=640&h=640&fit=crop'],
      },
      {
        name: 'Ševrón vlajka ČR+UA – vyšívaný',
        slug: 'sevron-vlajka-cr-ua-vysivany',
        priceCzk: 190,
        stock: 150,
        categoryId: sevrony.id,
        description: 'Kombinovaný ševrón s českou a ukrajinskou vlajkou. Symbolizuje spojenectví. Rozměr 8×5 cm, suchý zip.',
        images: ['https://images.unsplash.com/photo-1575908539614-ff89490f4a78?w=640&h=640&fit=crop'],
      },
      {
        name: 'Sada ševrónů České stopy – 3 ks',
        slug: 'sada-sevronu-ceske-stopy-3ks',
        priceCzk: 590,
        stock: 45,
        categoryId: sevrony.id,
        description: 'Sada tří vyšívaných ševrónů: logo České stopy, vlajky ČR+UA a bojový odznak. Vše se suchým zipem.',
        images: [
          'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=640&h=640&fit=crop',
          'https://images.unsplash.com/photo-1575908539614-ff89490f4a78?w=640&h=640&fit=crop',
        ],
      },

      // Vlajky
      {
        name: 'Vlajka České republiky 90×60 cm',
        slug: 'vlajka-ceske-republiky-90x60',
        priceCzk: 349,
        stock: 60,
        categoryId: vlajky.id,
        description: 'Prémiová tkaná vlajka ČR. Rozměr 90×60 cm, polyester 110g/m², dvě průchodky pro zavěšení.',
        images: ['https://images.unsplash.com/photo-1519750383296-a0c6f61b7b1f?w=640&h=640&fit=crop'],
      },
      {
        name: 'Vlajka Ukrajiny 90×60 cm',
        slug: 'vlajka-ukrajiny-90x60',
        priceCzk: 349,
        stock: 60,
        categoryId: vlajky.id,
        description: 'Prémiová tkaná vlajka Ukrajiny. Rozměr 90×60 cm, polyester 110g/m², dvě průchodky pro zavěšení.',
        images: ['https://images.unsplash.com/photo-1648826891786-bfe94cef2588?w=640&h=640&fit=crop'],
      },
      {
        name: 'Stolní vlajka ČR+UA – sada',
        slug: 'stolni-vlajka-cr-ua-sada',
        priceCzk: 290,
        stock: 40,
        categoryId: vlajky.id,
        description: 'Sada dvou stolních vlajek (ČR a UA) na plastovém stojánku. Rozměr vlajky 14×21 cm. Vhodné na stůl nebo poličku.',
        images: ['https://images.unsplash.com/photo-1575908539614-ff89490f4a78?w=640&h=640&fit=crop'],
      },

      // Oblečení
      {
        name: 'Tričko Česká stopa – navy',
        slug: 'tricko-ceska-stopa-navy',
        priceCzk: 590,
        stock: 80,
        categoryId: obleceni.id,
        description: '100% česaná bavlna 180g/m². Vyšívka loga na hrudi, tisk na zádech. Dostupné S–XXL v navy blue.',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640&h=640&fit=crop'],
      },
      {
        name: 'Mikina s kapucí Česká stopa',
        slug: 'mikina-s-kapuci-ceska-stopa',
        priceCzk: 990,
        stock: 35,
        categoryId: obleceni.id,
        description: 'Těžká bavlna 320g/m², klokaní kapsa, zip, vyšité logo. Unisex střih v navy blue. Dostupné S–XXL.',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=640&h=640&fit=crop'],
      },
      {
        name: 'Kšiltovka Česká stopa',
        slug: 'ksiltovka-ceska-stopa',
        priceCzk: 390,
        stock: 55,
        categoryId: obleceni.id,
        description: 'Šestipanelová kšiltovka, kovová přezka, vyšité logo. Navy blue. Nastavitelná velikost.',
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=640&h=640&fit=crop'],
      },

      // Hrnečky a dárky
      {
        name: 'Keramický hrnek Česká stopa 330ml',
        slug: 'keramicky-hrnek-ceska-stopa-330ml',
        priceCzk: 390,
        stock: 70,
        categoryId: hrnecky.id,
        description: 'Ručně malovaný keramický hrnek s logem České stopy. Objem 330 ml, matná glazura navy blue, myčka odolný.',
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=640&h=640&fit=crop'],
      },
      {
        name: 'Termohrnek nerezový 400ml',
        slug: 'termohrnek-nerezovy-400ml',
        priceCzk: 590,
        stock: 45,
        categoryId: hrnecky.id,
        description: 'Dvojitá nerezová stěna, udržuje teplotu 8 h. Laserově gravírované logo. Bezpečnostní víčko, BPA free.',
        images: ['https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=640&h=640&fit=crop'],
      },
      {
        name: 'Háčkovaný zajíc – ručně vyrobený',
        slug: 'hackovany-zajic-rucne-vyrobeny',
        priceCzk: 490,
        stock: 20,
        categoryId: hrnecky.id,
        description: 'Ručně háčkovaný zajíček v barvách ČR — bílý s modrými a červenými detaily. Výška cca 18 cm. Hypoalergenní výplň. Každý kus je originál.',
        images: ['https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=640&h=640&fit=crop'],
      },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: { stock: p.stock, priceCzk: p.priceCzk, images: p.images },
        create: p,
      });
    }

    console.log(`✓ Produkty: ${products.length} kusů`);
    console.log('Seed dokončen.');
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
