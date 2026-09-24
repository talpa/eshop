import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Shield, Heart, FileText, ChevronRight, ChevronLeft, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localName, localDesc } from '../../lib/localise';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Product, ProductsResponse, Category, MilitaryUnit } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

const HOW_IT_WORKS_ICONS = [ShoppingCart, Shield, Heart, FileText];

function CardImageSlider({ images, productSlug }: { images: string[]; productSlug: string }) {
  const [current, setCurrent] = useState(0);

  if (!images[0]) {
    return (
      <Link to={`/products/${productSlug}`}>
        <div className="aspect-square bg-slate-100 flex items-center justify-center">
          <span className="text-slate-300 text-4xl">🎁</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative aspect-square bg-slate-100 group">
      <Link to={`/products/${productSlug}`} className="block w-full h-full">
        <img src={getImageUrl(images[current])} alt="" className="w-full h-full object-contain" />
      </Link>
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(i => (i + 1) % images.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {images.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const categorySlug = searchParams.get('category') || '';
  const unitSlug = searchParams.get('unit') || '';
  const addItem = useCartStore(s => s.addItem);
  const { t, i18n } = useTranslation();

  const HOW_IT_WORKS = [
    { icon: HOW_IT_WORKS_ICONS[0], title: t('home.howItWorks.step1.title'), text: t('home.howItWorks.step1.text') },
    { icon: HOW_IT_WORKS_ICONS[1], title: t('home.howItWorks.step2.title'), text: t('home.howItWorks.step2.text') },
    { icon: HOW_IT_WORKS_ICONS[2], title: t('home.howItWorks.step3.title'), text: t('home.howItWorks.step3.text') },
    { icon: HOW_IT_WORKS_ICONS[3], title: t('home.howItWorks.step4.title'), text: t('home.howItWorks.step4.text') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['products', categorySlug, search, unitSlug],
    queryFn: () => api.get<ProductsResponse>('/products', { params: { categorySlug, search, unitSlug } }).then(r => r.data),
  });

  const selectUnit = (slug: string) => {
    setSearchParams(p => {
      if (p.get('unit') === slug) { p.delete('unit'); } else { p.set('unit', slug); }
      return p;
    });
    document.getElementById('produkty')?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then(r => r.data),
  });

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const user = useAuthStore(s => s.user);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(t('home.addedToCart', { name: product.name }));
  };

  return (
    <div>
      {/* Hero — unit-focused */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-8 md:gap-16">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 bg-brand-600/30 border border-brand-500/40 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6">
                <Heart size={14} />
                {t('home.hero.platformBadge')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {t('home.hero.titleMain')}<br />
                <span className="text-brand-400">{t('home.hero.titleHighlight')}</span>
              </h1>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                {t('home.hero.subtitleNew')}
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="#jednotky"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('home.hero.selectUnit')} <ChevronRight size={16} />
                </a>
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Heart size={16} /> {t('home.hero.donateNow')}
                </Link>
              </div>
            </div>
            {/* Drone illustration */}
            <div className="hidden md:flex flex-shrink-0 items-center justify-center w-56 lg:w-72"
              style={{ animation: 'drone-hover 5s ease-in-out infinite', opacity: 0.18 }}>
              <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <line x1="110" y1="110" x2="42" y2="42" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                <line x1="110" y1="110" x2="178" y2="42" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                <line x1="110" y1="110" x2="42" y2="178" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                <line x1="110" y1="110" x2="178" y2="178" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                <circle cx="42" cy="42" r="26" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.08"/>
                <circle cx="178" cy="42" r="26" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.08"/>
                <circle cx="42" cy="178" r="26" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.08"/>
                <circle cx="178" cy="178" r="26" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.08"/>
                <circle cx="42" cy="42" r="20" stroke="white" strokeWidth="2.5" strokeDasharray="5 4"
                  style={{ transformOrigin: '42px 42px', animation: 'rotor-spin 0.6s linear infinite' }}/>
                <circle cx="178" cy="42" r="20" stroke="white" strokeWidth="2.5" strokeDasharray="5 4"
                  style={{ transformOrigin: '178px 42px', animation: 'rotor-spin 0.6s linear infinite reverse' }}/>
                <circle cx="42" cy="178" r="20" stroke="white" strokeWidth="2.5" strokeDasharray="5 4"
                  style={{ transformOrigin: '42px 178px', animation: 'rotor-spin 0.6s linear infinite reverse' }}/>
                <circle cx="178" cy="178" r="20" stroke="white" strokeWidth="2.5" strokeDasharray="5 4"
                  style={{ transformOrigin: '178px 178px', animation: 'rotor-spin 0.6s linear infinite' }}/>
                <rect x="82" y="82" width="56" height="56" rx="10" fill="white" fillOpacity="0.9"/>
                <circle cx="110" cy="110" r="16" stroke="#0f172a" strokeWidth="3" fill="none"/>
                <circle cx="110" cy="110" r="8" fill="#0f172a"/>
                <circle cx="104" cy="104" r="3" fill="white" fillOpacity="0.5"/>
                <line x1="90" y1="138" x2="80" y2="152" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <line x1="130" y1="138" x2="140" y2="152" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <line x1="73" y1="152" x2="87" y2="152" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <line x1="133" y1="152" x2="147" y2="152" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Jednotky — primární vstup */}
      {units && units.length > 0 && (
        <div id="jednotky" className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('home.units.whoToHelp')}</h2>
              <p className="text-slate-500">{t('home.units.unitClickDesc')}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => (
                <Link
                  key={unit.id}
                  to={`/jednotky/${unit.slug}`}
                  className="flex items-start gap-4 rounded-xl p-5 border-2 border-slate-200 bg-white hover:border-brand-400 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-800 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:bg-brand-600 transition-colors">
                    {unit.logo ? (
                      <img src={getImageUrl(unit.logo)} alt={unit.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Shield size={24} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors leading-snug">
                      {localName(unit, i18n.language)}
                    </h3>
                    {localDesc(unit, i18n.language) && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                        {localDesc(unit, i18n.language)}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-brand-600 mt-2.5 font-semibold">
                      {t('home.units.viewProfile')} <ChevronRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Produkty */}
      <div id="produkty" className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {unitSlug && units
                ? t('home.products.fromUnit', { name: localName(units.find(u => u.slug === unitSlug) ?? { name: '' }, i18n.language) })
                : t('home.products.all')}
            </h2>
            {!unitSlug && <p className="text-sm text-slate-500 mt-0.5">{t('home.products.selectUnitHint')}</p>}
          </div>
          {unitSlug && (
            <button onClick={() => setSearchParams(p => { p.delete('unit'); return p; })} className="text-sm text-brand-600 hover:underline">
              {t('home.products.clearFilter')}
            </button>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchParams(p => { p.set('search', search); return p; })}
              placeholder={t('home.search.placeholder')}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams(p => { p.delete('category'); return p; })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!categorySlug ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 text-slate-600 hover:border-brand-400'}`}
            >
              {t('home.search.all')}
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSearchParams(p => { p.set('category', cat.slug); return p; })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${categorySlug === cat.slug ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 text-slate-600 hover:border-brand-400'}`}
              >
                {localName(cat, i18n.language)}
              </button>
            ))}
          </div>
          {units && units.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSearchParams(p => { p.delete('unit'); return p; })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!unitSlug ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-300 text-slate-500 hover:border-slate-500'}`}
              >
                {t('home.units.allUnits')}
              </button>
              {units.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => selectUnit(unit.slug)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${unitSlug === unit.slug ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-300 text-slate-500 hover:border-slate-500'}`}
                >
                  {localName(unit, i18n.language)}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && <div className="text-center py-12 text-slate-400">{t('common.loading')}</div>}
        {!isLoading && data?.products.length === 0 && (
          <div className="text-center py-12 text-slate-400">{t('home.products.empty')}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.products.map(product => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all">
              <div className="relative">
                <CardImageSlider images={product.images} productSlug={product.slug} />
                {user?.role === 'ADMIN' && (
                  <Link
                    to={`/admin/products?edit=${product.id}`}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm transition-colors"
                    title="Upravit produkt"
                  >
                    <Pencil size={13} className="text-slate-500" />
                  </Link>
                )}
              </div>
              <div className="p-3">
                <Link to={`/products/${product.slug}`} className="font-medium text-sm hover:text-brand-600 line-clamp-2">
                  {localName(product, i18n.language)}
                </Link>
                {product.militaryUnits && product.militaryUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {product.militaryUnits.slice(0, 2).map(u => (
                      <span key={u.id} className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full">{localName(u, i18n.language)}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="font-bold text-brand-600">{formatPrice(product.priceCzk)}</span>
                    <span className="text-xs text-slate-400 block leading-none">min. dar</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
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
      </div>

      {/* Jak to funguje — sekundární, dole */}
      <div className="bg-slate-50 border-t border-slate-200 mt-4">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-center mb-8 text-slate-800">{t('home.howItWorks.title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand-600" />
                </div>
                <div className="w-6 h-6 bg-brand-600 text-white rounded-full text-xs font-bold flex items-center justify-center mb-2">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
