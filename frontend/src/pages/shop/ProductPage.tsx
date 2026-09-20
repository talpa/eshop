import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Plus, Minus, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';
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
        <ArrowLeft size={14} /> Zpět na výběr dárků
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.images[0] ? (
            <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-300 text-6xl">🎁</span>
          )}
        </div>
        <div>
          {product.category && (
            <Link to={`/products?category=${product.category.slug}`} className="text-xs text-brand-600 uppercase tracking-wider font-medium">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold mt-1 mb-2">{product.name}</h1>

          <div className="mb-4">
            <p className="text-3xl font-bold text-brand-600">{formatPrice(product.priceCzk)}</p>
            <p className="text-xs text-slate-400 mt-0.5">minimální výše daru — darovat můžete i více</p>
          </div>

          {product.description && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{product.description}</p>}

          {product.militaryUnits && product.militaryUnits.length > 0 && (
            <div className="mb-5 p-3 bg-brand-50 border border-brand-100 rounded-lg">
              <p className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1">
                <Shield size={12} /> Tento dárek je spojen s jednotkami:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.militaryUnits.map(u => (
                  <span key={u.id} className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                    {u.name}
                  </span>
                ))}
              </div>
            </div>
          )}

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
          <p className="text-xs text-slate-400 mt-2">Dostupnost: {product.stock} ks</p>
        </div>
      </div>
    </div>
  );
}
