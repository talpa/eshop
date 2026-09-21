import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Shield, ChevronLeft, ShoppingCart, Bell, ChevronDown, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { MilitaryUnit, ProductsResponse } from '../../types';
import { localName, localDesc } from '../../lib/localise';
import { formatPrice, getImageUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function UnitPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const addItem = useCartStore(s => s.addItem);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const { data: unit, isLoading } = useQuery<MilitaryUnit>({
    queryKey: ['unit-detail', slug],
    queryFn: () => api.get<MilitaryUnit>(`/military-units/by-slug/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  const { data: productsData } = useQuery<ProductsResponse>({
    queryKey: ['unit-products', slug],
    queryFn: () => api.get<ProductsResponse>('/products', { params: { unitSlug: slug, limit: 50 } }).then(r => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Jednotka nenalezena.</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Zpět na eshop</Link>
      </div>
    );
  }

  const youtubeVideos = (unit.youtubeUrls ?? [])
    .map(url => ({ url, id: getYouTubeId(url) }))
    .filter(v => v.id);

  const updates = unit.updates ?? [];
  const visibleUpdates = showAllUpdates ? updates : updates.slice(0, 2);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft size={15} /> Zpět na eshop
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {unit.logo ? (
                <img src={getImageUrl(unit.logo)} alt={unit.name} className="w-full h-full object-contain p-2" />
              ) : (
                <Shield size={40} className="text-white/60" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{localName(unit, i18n.language)}</h1>
              {unit.activity && (
                <span className="inline-block mt-2 text-xs font-mono bg-brand-600/40 border border-brand-500/40 text-brand-300 px-2.5 py-1 rounded-full">
                  {unit.activity.code}
                </span>
              )}
            </div>
          </div>
          {localDesc(unit, i18n.language) && (
            <p className="mt-5 text-slate-300 leading-relaxed max-w-3xl">
              {localDesc(unit, i18n.language)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* YouTube videa */}
        {youtubeVideos.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Videa</h2>
            <div className={`grid gap-4 ${youtubeVideos.length === 1 ? 'grid-cols-1 max-w-2xl' : 'sm:grid-cols-2'}`}>
              {youtubeVideos.map(({ id }) => (
                <div key={id} className="relative w-full rounded-xl overflow-hidden bg-black shadow-md" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Aktuality */}
        {updates.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={16} className="text-brand-500" /> Aktuality
            </h2>
            <div className="space-y-5">
              {visibleUpdates.map((update, idx) => (
                <div key={update.id} className={`bg-white rounded-xl border border-slate-200 p-5 ${idx === 0 ? 'border-l-4 border-l-brand-400' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-800">{update.title}</h3>
                    <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                      {new Date(update.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{update.content}</p>
                </div>
              ))}
            </div>
            {updates.length > 2 && (
              <button
                onClick={() => setShowAllUpdates(v => !v)}
                className="mt-4 flex items-center gap-1.5 text-sm text-brand-600 hover:underline font-medium"
              >
                {showAllUpdates ? 'Skrýt starší' : `Zobrazit starší aktuality (${updates.length - 2})`}
                <ChevronDown size={14} className={`transition-transform ${showAllUpdates ? 'rotate-180' : ''}`} />
              </button>
            )}
          </section>
        )}

        {/* Produkty */}
        {productsData && productsData.products.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Dárky pro {localName(unit, i18n.language)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsData.products.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all">
                  <Link to={`/products/${product.slug}`}>
                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      {product.images[0] ? (
                        <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-300 text-4xl">🎁</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link to={`/products/${product.slug}`} className="font-medium text-sm hover:text-brand-600 line-clamp-2">
                      {localName(product, i18n.language)}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="font-bold text-brand-600">{formatPrice(product.priceCzk)}</span>
                        <span className="text-xs text-slate-400 block leading-none">min. dar</span>
                      </div>
                      <button
                        onClick={() => { addItem(product); toast.success(t('home.addedToCart', { name: product.name })); }}
                        disabled={product.stock === 0}
                        className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-40 transition-colors"
                        title={t('product.addToCart')}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                    {product.stock === 0 && <p className="text-xs text-red-500 mt-1">{t('product.outOfStock')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Odkaz na celý eshop */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            <ExternalLink size={13} /> Zobrazit celý eshop
          </Link>
          <Link to="/donate" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            <ExternalLink size={13} /> Zaslat dar přímo
          </Link>
        </div>

      </div>
    </div>
  );
}
