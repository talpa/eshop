import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Shield, ChevronLeft, ShoppingCart, Bell, ChevronDown, Heart, Image, Play, ExternalLink } from 'lucide-react';
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

type MediaTab = 'photos' | 'videos';
const UPDATES_STEP = 2;

export default function UnitPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const addItem = useCartStore(s => s.addItem);
  const [shownCount, setShownCount] = useState(UPDATES_STEP);
  const [activeTab, setActiveTab] = useState<MediaTab>('photos');
  const tabInitialized = useRef(false);

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

  useEffect(() => {
    if (unit && !tabInitialized.current) {
      tabInitialized.current = true;
      setActiveTab((unit.photos ?? []).length > 0 ? 'photos' : 'videos');
    }
  }, [unit]);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">{t('common.loading')}</div>;
  }

  if (!unit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Jednotka nenalezena.</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Zpět na eshop</Link>
      </div>
    );
  }

  const youtubeVideos = (unit.youtubeUrls ?? [])
    .map(url => ({ url, id: getYouTubeId(url) }))
    .filter((v): v is { url: string; id: string } => v.id !== null);

  const photos = unit.photos ?? [];
  const lang = i18n.language;
  const localUpdate = (u: NonNullable<MilitaryUnit['updates']>[number]) => ({
    title: (lang === 'en' && u.titleEn) || (lang === 'uk' && u.titleUk) || (lang === 'de' && u.titleDe) || u.title,
    content: (lang === 'en' && u.contentEn) || (lang === 'uk' && u.contentUk) || (lang === 'de' && u.contentDe) || u.content,
  });

  const updates = unit.updates ?? [];
  const visibleUpdates = updates.slice(0, shownCount);
  const hasMore = updates.length > shownCount;

  const hasPhotos = photos.length > 0;
  const hasVideos = youtubeVideos.length > 0;
  const hasMedia = hasPhotos || hasVideos;

  const showPhotosContent = hasPhotos && (!hasVideos || activeTab === 'photos');
  const showVideosContent = hasVideos && (!hasPhotos || activeTab === 'videos');

  const products = productsData?.products ?? [];

  return (
    <div>
      {/* Compact hero */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-5 transition-colors"
          >
            <ChevronLeft size={14} /> Zpět na eshop
          </Link>
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {unit.logo ? (
                <img src={getImageUrl(unit.logo)} alt={unit.name} className="w-full h-full object-contain p-2" />
              ) : (
                <Shield size={32} className="text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-snug">{localName(unit, i18n.language)}</h1>
              {unit.activity && (
                <span className="inline-block mt-1.5 text-xs font-mono bg-brand-600/40 border border-brand-500/40 text-brand-200 px-2 py-0.5 rounded-full">
                  {unit.activity.code}
                </span>
              )}
              {localDesc(unit, i18n.language) && (
                <p className="mt-2 text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {localDesc(unit, i18n.language)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2.5">
          <Link
            to={`/donate?unit=${unit.slug}`}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <Heart size={13} /> Darovat přímo
          </Link>
          <button
            onClick={() => document.getElementById('produkty')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-brand-400 hover:text-brand-700 text-slate-600 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <ShoppingCart size={13} /> Vybrat dárek
          </button>
          <span className="text-xs text-slate-400 hidden sm:block ml-1 truncate">
            {localName(unit, i18n.language)}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Aktuality */}
        {updates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} className="text-brand-500" />
              <h2 className="text-base font-bold text-slate-800">Aktuality</h2>
              <span className="text-xs text-slate-400">({updates.length})</span>
            </div>
            <div className="space-y-3">
              {visibleUpdates.map((update, idx) => {
                const loc = localUpdate(update);
                return (
                  <div
                    key={update.id}
                    className={`rounded-xl border p-4 bg-white ${idx === 0 ? 'border-brand-200 border-l-[3px] border-l-brand-400' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-sm text-slate-800 leading-snug">{loc.title}</h3>
                      <time className="text-xs text-slate-400 flex-shrink-0 mt-0.5 whitespace-nowrap">
                        {new Date(update.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{loc.content}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4">
              {hasMore && (
                <button
                  onClick={() => setShownCount(n => n + UPDATES_STEP)}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <ChevronDown size={14} />
                  Starší aktuality ({updates.length - shownCount})
                </button>
              )}
              {shownCount > UPDATES_STEP && (
                <button
                  onClick={() => setShownCount(UPDATES_STEP)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Skrýt starší
                </button>
              )}
            </div>
          </section>
        )}

        {/* Media tabs: Fotky / Videa */}
        {hasMedia && (
          <section>
            <div className="flex gap-0 border-b border-slate-200 mb-5">
              {hasPhotos && (
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    showPhotosContent ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Image size={14} />
                  Fotky
                  <span className="text-xs opacity-50">({photos.length})</span>
                </button>
              )}
              {hasVideos && (
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    showVideosContent ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Play size={14} />
                  Videa
                  <span className="text-xs opacity-50">({youtubeVideos.length})</span>
                </button>
              )}
            </div>

            {showPhotosContent && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <a
                    key={i}
                    href={getImageUrl(photo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 block hover:opacity-90 transition-opacity"
                  >
                    <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            )}

            {showVideosContent && (
              <div className={`grid gap-4 ${youtubeVideos.length === 1 ? 'grid-cols-1 max-w-xl' : 'sm:grid-cols-2'}`}>
                {youtubeVideos.map(({ id }) => (
                  <div
                    key={id}
                    className="relative w-full rounded-xl overflow-hidden bg-black shadow-md"
                    style={{ paddingBottom: '56.25%' }}
                  >
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
            )}
          </section>
        )}

        {/* Products */}
        {products.length > 0 && (
          <section id="produkty" className="scroll-mt-32">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              Dárky od {localName(unit, i18n.language)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all"
                >
                  <Link to={`/products/${product.slug}`}>
                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      {product.images[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl text-slate-300">🎁</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-medium text-sm hover:text-brand-600 line-clamp-2 leading-snug block"
                    >
                      {localName(product, i18n.language)}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="font-bold text-sm text-brand-600">{formatPrice(product.priceCzk)}</span>
                        <span className="text-xs text-slate-400 block leading-none">min. dar</span>
                      </div>
                      <button
                        onClick={() => { addItem(product); toast.success(t('home.addedToCart', { name: product.name })); }}
                        disabled={product.stock === 0}
                        className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-40 transition-colors"
                        title={t('product.addToCart')}
                      >
                        <ShoppingCart size={13} />
                      </button>
                    </div>
                    {product.stock === 0 && (
                      <p className="text-xs text-red-500 mt-1">{t('product.outOfStock')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors">
            <ExternalLink size={11} /> Celý eshop
          </Link>
          <Link to="/donate" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors">
            <Heart size={11} /> Přímý dar
          </Link>
        </div>

      </div>
    </div>
  );
}
