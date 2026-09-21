import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Shield, Heart, FileText, ChevronRight, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localName, localDesc } from '../../lib/localise';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Product, ProductsResponse, Category, MilitaryUnit } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

const HOW_IT_WORKS_ICONS = [ShoppingCart, Shield, Heart, FileText];

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
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand-600/30 border border-brand-500/40 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6">
              <Shield size={14} />
              {t('home.hero.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t('home.hero.title1')}<br />
              <span className="text-brand-400">{t('home.hero.title2')}</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <a href="#produkty" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              {t('home.hero.cta')} <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Jak to funguje */}
      <div className="bg-slate-50 border-b border-slate-200">
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

      {/* Vojenské jednotky */}
      {units && units.length > 0 && (
        <div className="border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">{t('home.units.title')}</h2>
              <p className="text-sm text-slate-500">{t('home.units.clickFilter')}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => {
                const active = unitSlug === unit.slug;
                return (
                  <button
                    key={unit.id}
                    onClick={() => selectUnit(unit.slug)}
                    className={`flex items-start gap-4 rounded-xl p-4 border-2 text-left w-full transition-all ${active ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-brand-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-brand-600' : 'bg-brand-700'}`}>
                      <Shield size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm">{localName(unit, i18n.language)}</h3>
                        {active && <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">{t('home.units.filtered')}</span>}
                      </div>
                      {localDesc(unit, i18n.language) && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{localDesc(unit, i18n.language)}</p>}
                      {!active && <p className="text-xs text-brand-600 mt-1.5 font-medium">{t('home.units.showGifts')}</p>}
                      {active && <p className="text-xs text-brand-600 mt-1.5 font-medium">{t('home.units.clearFilter')}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Produkty */}
      <div id="produkty" className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {unitSlug && units
              ? t('home.products.forUnit', { name: localName(units.find(u => u.slug === unitSlug) ?? { name: '' }, i18n.language) })
              : t('home.products.title')}
          </h2>
          {unitSlug && (
            <button onClick={() => setSearchParams(p => { p.delete('unit'); return p; })} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              {t('home.products.clearFilter')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
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
        </div>

        {isLoading && <div className="text-center py-12 text-slate-400">{t('common.loading')}</div>}
        {!isLoading && data?.products.length === 0 && (
          <div className="text-center py-12 text-slate-400">{t('home.products.empty')}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.products.map(product => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all">
              <div className="relative">
                <Link to={`/products/${product.slug}`}>
                  <div className="aspect-square bg-slate-100 flex items-center justify-center">
                    {product.images[0] ? (
                      <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-300 text-4xl">🎁</span>
                    )}
                  </div>
                </Link>
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
    </div>
  );
}
