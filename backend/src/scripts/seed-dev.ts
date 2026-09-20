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
        where: { slug: 'odznaky-plakety' },
        update: {},
        create: { name: 'Odznaky a plakety', slug: 'odznaky-plakety', description: 'Bojové odznaky, pamětní plakety a insignie' },
      }),
      prisma.category.upsert({
        where: { slug: 'obleceni' },
        update: {},
        create: { name: 'Oblečení', slug: 'obleceni', description: 'Trička, mikiny a kšiltovky s motivem České stopy' },
      }),
      prisma.category.upsert({
        where: { slug: 'vybaveni' },
        update: {},
        create: { name: 'Vybavení', slug: 'vybaveni', description: 'Praktické vybavení a doplňky pro misi' },
      }),
      prisma.category.upsert({
        where: { slug: 'pametni-predmety' },
        update: {},
        create: { name: 'Pamětní předměty', slug: 'pametni-predmety', description: 'Unikátní předměty z mise a sběratelské položky' },
      }),
    ]);

    console.log('✓ Kategorie:', cats.map(c => c.name).join(', '));

    const [odznaky, obleceni, vybaveni, pametni] = cats;

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

    // Produkty – tematicky vhodné dárky
    const products = [
      {
        name: 'Bojový odznak České stopy',
        slug: 'bojovy-odznak-ceske-stopy',
        priceCzk: 490,
        stock: 50,
        categoryId: odznaky.id,
        description: 'Originální kovový odznak s logem nadačního fondu České stopy. Ručně lakovaný, průměr 4 cm. Každý kus je číslován.',
        images: ['https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=640&h=640&fit=crop'],
      },
      {
        name: 'Pamětní plaketa mise Ukrajina',
        slug: 'pametni-plaketa-mise-ukrajina',
        priceCzk: 1290,
        stock: 20,
        categoryId: odznaky.id,
        description: 'Mosazná plaketa na dřevěném podstavci s gravírovaným věnováním. Rozměr 15×10 cm. Vhodná jako dekorativní předmět.',
        images: ['https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=640&h=640&fit=crop'],
      },
      {
        name: 'Tričko Česká stopa – pánské',
        slug: 'tricko-ceska-stopa-panske',
        priceCzk: 590,
        stock: 80,
        categoryId: obleceni.id,
        description: '100% česaná bavlna, výšivka loga na hrudi. Unisex střih, dostupné v S–XXL. Prané na 40°C.',
        images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=640&h=640&fit=crop'],
      },
      {
        name: 'Mikina s kapucí Česká stopa',
        slug: 'mikina-ceska-stopa',
        priceCzk: 990,
        stock: 40,
        categoryId: obleceni.id,
        description: 'Těžká bavlněná mikina 320g/m², vyšité logo, zip. Unisex střih v navy blue barvě. Dostupné S–XXL.',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=640&h=640&fit=crop'],
      },
      {
        name: 'Kšiltovka Česká stopa',
        slug: 'ksiltovka-ceska-stopa',
        priceCzk: 390,
        stock: 60,
        categoryId: obleceni.id,
        description: 'Šestipanelová kšiltovka s kovovou přezkou. Vyšité logo, navy blue. Nastavitelná velikost.',
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=640&h=640&fit=crop'],
      },
      {
        name: 'Taktický paracord náramek',
        slug: 'takticky-paracord-naramek',
        priceCzk: 290,
        stock: 100,
        categoryId: vybaveni.id,
        description: 'Ručně pletený náramek z 550lb paracordu v barvách ČR. Obsahuje nožík, křesadlo a píšťalku. Obvod 20–24 cm.',
        images: ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=640&h=640&fit=crop'],
      },
      {
        name: 'Kapesní multitool EDC',
        slug: 'kapesni-multitool-edc',
        priceCzk: 890,
        stock: 30,
        categoryId: vybaveni.id,
        description: '14 funkcí v nerezové oceli: nůž, pilník, šroubovák, otvírák a více. Dodáváno v pouzdře s klipem na opasek.',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=640&fit=crop'],
      },
      {
        name: 'Termohrnek s logem 400ml',
        slug: 'termohrnek-logo-400ml',
        priceCzk: 490,
        stock: 55,
        categoryId: pametni.id,
        description: 'Dvojitá nerezová stěna, udržuje teplotu 8 h. Laserově gravírované logo. Bezpečnostní víčko, BPA free.',
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=640&h=640&fit=crop'],
      },
      {
        name: 'Kniha "Česká stopa na Ukrajině"',
        slug: 'kniha-ceska-stopa-na-ukrajine',
        priceCzk: 349,
        stock: 25,
        categoryId: pametni.id,
        description: 'Dokumentární publikace mapující působení českých vojáků a dobrovolníků. 180 stran, bohatá fotografická příloha.',
        images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=640&h=640&fit=crop'],
      },
      {
        name: 'Samolepky Česká stopa – sada 10 ks',
        slug: 'samolepky-ceska-stopa-sada',
        priceCzk: 149,
        stock: 200,
        categoryId: pametni.id,
        description: 'Vinylové UV odolné samolepky s logem a motivy mise. Vhodné na auto, helmu nebo notebook. Rozměry 5–10 cm.',
        images: ['https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=640&h=640&fit=crop'],
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
