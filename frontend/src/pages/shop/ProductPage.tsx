import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const addItem = useCartStore(s => s.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get<Product>(`/products/${slug}`).then(r => r.data),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-12 text-slate-400">Načítám...</div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-12 text-slate-400">Produkt nenalezen.</div>;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${product.name} přidán do košíku.`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft size={14} /> Zpět
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-300 text-6xl">📦</span>
          )}
        </div>
        <div>
          {product.category && (
            <Link to={`/products?category=${product.category.slug}`} className="text-xs text-brand-600 uppercase tracking-wider font-medium">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold mt-1 mb-3">{product.name}</h1>
          <p className="text-3xl font-bold text-brand-600 mb-4">{formatPrice(product.priceCzk)}</p>
          {product.description && <p className="text-slate-600 text-sm mb-6 leading-relaxed">{product.description}</p>}

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-500">Množství:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-1 border border-slate-300 rounded hover:bg-slate-100"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="p-1 border border-slate-300 rounded hover:bg-slate-100"><Plus size={14} /></button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-40"
          >
            <ShoppingCart size={18} />
            {product.stock === 0 ? 'Není skladem' : 'Přidat do košíku'}
          </button>
          <p className="text-xs text-slate-400 mt-2">Skladem: {product.stock} ks</p>
        </div>
      </div>
    </div>
  );
}
