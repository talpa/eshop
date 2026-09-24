import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Plus, Minus, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localName, localDesc } from '../../lib/localise';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

function ImageSlider({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
        <span className="text-slate-300 text-6xl">🎁</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden group">
      <img src={getImageUrl(images[current])} alt="" className="w-full h-full object-contain" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrent(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
          <div className="flex gap-1.5 mt-3 px-1">
            {images.map((url, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === current ? 'border-brand-500' : 'border-transparent'}`}>
                <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const addItem = useCartStore(s => s.addItem);
  const { t, i18n } = useTranslation();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get<Product>(`/products/${slug}`).then(r => r.data),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-12 text-slate-400">{t('common.loading')}</div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-12 text-slate-400">{t('product.notFound')}</div>;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(t('product.addedToCart', { name: product.name }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft size={14} /> {t('product.back')}
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <ImageSlider images={product.images || []} />
        <div>
          {product.category && (
            <Link to={`/products?category=${product.category.slug}`} className="text-xs text-brand-600 uppercase tracking-wider font-medium">
              {localName(product.category, i18n.language)}
            </Link>
          )}
          <h1 className="text-2xl font-bold mt-1 mb-2">{localName(product, i18n.language)}</h1>
          <div className="mb-4">
            <p className="text-3xl font-bold text-brand-600">{formatPrice(product.priceCzk)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('product.minDonation')}</p>
          </div>
          {localDesc(product, i18n.language) && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{localDesc(product, i18n.language)}</p>}
          {product.militaryUnits && product.militaryUnits.length > 0 && (
            <div className="mb-5 p-3 bg-brand-50 border border-brand-100 rounded-lg">
              <p className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1">
                <Shield size={12} /> {t('product.linkedUnits')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.militaryUnits.map(u => (
                  <span key={u.id} className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-full font-medium">{localName(u, i18n.language)}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-500">{t('product.quantity')}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-1 border border-slate-300 rounded hover:bg-slate-100"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="p-1 border border-slate-300 rounded hover:bg-slate-100"><Plus size={14} /></button>
            </div>
          </div>
          <button onClick={handleAdd} disabled={product.stock === 0}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-40">
            <ShoppingCart size={18} />
            {product.stock === 0 ? t('product.outOfStock') : t('product.addToCart')}
          </button>
          <p className="text-xs text-slate-400 mt-2">{t('product.availability', { count: product.stock })}</p>
        </div>
      </div>
    </div>
  );
}
