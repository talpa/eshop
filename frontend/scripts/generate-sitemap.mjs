import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const SITE_URL = 'https://darek.fondceskestopy.eu';
const API_URL = `${SITE_URL}/api`;
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_URLS = [
  { loc: `${SITE_URL}/`,               priority: '1.0', changefreq: 'daily' },
  { loc: `${SITE_URL}/donate`,          priority: '0.7', changefreq: 'monthly' },
  { loc: `${SITE_URL}/privacy-policy`,  priority: '0.3', changefreq: 'yearly' },
];

function buildXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

async function generate() {
  try {
    const [unitsRes, productsRes] = await Promise.all([
      fetch(`${API_URL}/military-units`, { signal: AbortSignal.timeout(15000) }),
      fetch(`${API_URL}/products?limit=500`, { signal: AbortSignal.timeout(15000) }),
    ]);

    if (!unitsRes.ok || !productsRes.ok) throw new Error(`API HTTP ${unitsRes.status}/${productsRes.status}`);

    const units = await unitsRes.json();
    const { products } = await productsRes.json();

    const urls = [
      ...STATIC_URLS,
      ...units.map(u => ({ loc: `${SITE_URL}/jednotky/${u.slug}`, priority: '0.9', changefreq: 'weekly' })),
      ...products.map(p => ({ loc: `${SITE_URL}/products/${p.slug}`, priority: '0.6', changefreq: 'monthly' })),
    ];

    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), buildXml(urls), 'utf-8');
    console.log(`✓ Sitemap: ${urls.length} URLs (${units.length} jednotek, ${products.length} produktů)`);
  } catch (err) {
    console.warn(`⚠ Sitemap: API nedostupné (${err.message}), zachovávám statické URL.`);
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), buildXml(STATIC_URLS), 'utf-8');
  }
}

generate();
