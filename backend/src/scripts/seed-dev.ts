import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Kategorie – jedna pro každý typ předmětu
    const cats = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'odznaky' },
        update: {},
        create: { name: 'Odznaky', slug: 'odznaky', description: 'Kovové a smaltované odznaky' },
      }),
      prisma.category.upsert({
        where: { slug: 'sevrony' },
        update: {},
        create: { name: 'Ševrony', slug: 'sevrony', description: 'Vyšívané rukávové nášivky a ševrony' },
      }),
      prisma.category.upsert({
        where: { slug: 'vlajky' },
        update: {},
        create: { name: 'Vlajky', slug: 'vlajky', description: 'Vlajky ČR, Ukrajiny a vojenských jednotek' },
      }),
      prisma.category.upsert({
        where: { slug: 'tricka' },
        update: {},
        create: { name: 'Trička', slug: 'tricka', description: 'Trička s motivem České stopy' },
      }),
      prisma.category.upsert({
        where: { slug: 'mikiny' },
        update: {},
        create: { name: 'Mikiny', slug: 'mikiny', description: 'Mikiny a kšiltovky s motivem České stopy' },
      }),
      prisma.category.upsert({
        where: { slug: 'hrnecky' },
        update: {},
        create: { name: 'Hrnečky', slug: 'hrnecky', description: 'Keramické hrnky a termohrnky' },
      }),
      prisma.category.upsert({
        where: { slug: 'rucne-vyrabene' },
        update: {},
        create: { name: 'Ručně vyráběné', slug: 'rucne-vyrabene', description: 'Unikátní ručně vyráběné předměty' },
      }),
    ]);

    console.log('✓ Kategorie:', cats.map(c => c.name).join(', '));

    const [odznaky, sevrony, vlajky, tricka, mikiny, hrnecky, rucne] = cats;

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
      // Odznaky
      {
        name: 'Odznak České stopy – kovový',
        slug: 'odznak-ceske-stopy-kovovy',
        priceCzk: 290,
        stock: 80,
        categoryId: odznaky.id,
        description: 'Kovový odznak s logem nadačního fondu České stopy. Ručně lakovaný, průměr 3 cm. Zapínání na jehlici.',
        images: ['https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=640&h=640&fit=crop'],
      },
      {
        name: 'Smaltovaný odznak vlajka ČR+UA',
        slug: 'smaltoany-odznak-vlajka-cr-ua',
        priceCzk: 190,
        stock: 120,
        categoryId: odznaky.id,
        description: 'Smaltovaný kovový odznak s českou a ukrajinskou vlajkou vedle sebe. Průměr 2,5 cm, zapínání na jehlici.',
        images: ['https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=640&h=640&fit=crop'],
      },

      // Ševrony
      {
        name: 'Ševrón Česká stopa – vyšívaný',
        slug: 'sevron-ceska-stopa-vysivany',
        priceCzk: 290,
        stock: 100,
        categoryId: sevrony.id,
        description: 'Vyšívaný rukávový ševrón s logem České stopy. Rozměr 9×7 cm, suchý zip na zadní straně.',
        images: ['https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=640&h=640&fit=crop'],
      },
      {
        name: 'Ševrón vlajka ČR+UA – vyšívaný',
        slug: 'sevron-vlajka-cr-ua-vysivany',
        priceCzk: 190,
        stock: 150,
        categoryId: sevrony.id,
        description: 'Kombinovaný ševrón s českou a ukrajinskou vlajkou. Rozměr 8×5 cm, suchý zip.',
        images: ['https://images.unsplash.com/photo-1575908539614-ff89490f4a78?w=640&h=640&fit=crop'],
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
        description: 'Sada dvou stolních vlajek (ČR a UA) na plastovém stojánku. Rozměr vlajky 14×21 cm.',
        images: ['https://images.unsplash.com/photo-1575908539614-ff89490f4a78?w=640&h=640&fit=crop'],
      },

      // Trička
      {
        name: 'Tričko Česká stopa – navy',
        slug: 'tricko-ceska-stopa-navy',
        priceCzk: 590,
        stock: 80,
        categoryId: tricka.id,
        description: '100% česaná bavlna 180g/m². Vyšívka loga na hrudi, tisk na zádech. Dostupné S–XXL.',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640&h=640&fit=crop'],
      },
      {
        name: 'Tričko Česká stopa – bílé',
        slug: 'tricko-ceska-stopa-bile',
        priceCzk: 590,
        stock: 60,
        categoryId: tricka.id,
        description: '100% česaná bavlna 180g/m². Vyšívka loga na hrudi, tisk na zádech. Dostupné S–XXL v bílé.',
        images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=640&h=640&fit=crop'],
      },

      // Mikiny
      {
        name: 'Mikina s kapucí Česká stopa',
        slug: 'mikina-s-kapuci-ceska-stopa',
        priceCzk: 990,
        stock: 35,
        categoryId: mikiny.id,
        description: 'Těžká bavlna 320g/m², klokaní kapsa, zip, vyšité logo. Unisex střih v navy blue. Dostupné S–XXL.',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=640&h=640&fit=crop'],
      },
      {
        name: 'Kšiltovka Česká stopa',
        slug: 'ksiltovka-ceska-stopa',
        priceCzk: 390,
        stock: 55,
        categoryId: mikiny.id,
        description: 'Šestipanelová kšiltovka, kovová přezka, vyšité logo. Navy blue. Nastavitelná velikost.',
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=640&h=640&fit=crop'],
      },

      // Hrnečky
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

      // Ručně vyráběné
      {
        name: 'Háčkovaný zajíc – ručně vyrobený',
        slug: 'hackovany-zajic-rucne-vyrobeny',
        priceCzk: 490,
        stock: 20,
        categoryId: rucne.id,
        description: 'Ručně háčkovaný zajíček v barvách ČR — bílý s modrými a červenými detaily. Výška cca 18 cm. Hypoalergenní výplň. Každý kus je originál.',
        images: ['https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=640&h=640&fit=crop'],
      },
      {
        name: 'Pletený špek – ručně vyrobený',
        slug: 'pleteny-spek-rucne-vyrobeny',
        priceCzk: 390,
        stock: 15,
        categoryId: rucne.id,
        description: 'Háčkovaná hračka – realistický špek z vlny. Oblíbený dárek pro vojáky i jejich děti. Každý kus je originál, cca 12 cm.',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=640&fit=crop'],
      },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: { stock: p.stock, priceCzk: p.priceCzk, images: p.images, categoryId: p.categoryId },
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
