import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { Product, ProductsResponse, Category } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const categorySlug = searchParams.get('category') || '';
  const addItem = useCartStore(s => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['products', categorySlug, search],
    queryFn: () => api.get<ProductsResponse>('/products', { params: { categorySlug, search } }).then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then(r => r.data),
  });

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) { toast.error('Produkt není skladem.'); return; }
    addItem(product);
    toast.success(`${product.name} přidán do košíku.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearchParams(p => { p.set('search', search); return p; })}
            placeholder="Hledat produkty..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams(p => { p.delete('category'); return p; })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!categorySlug ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 text-slate-600 hover:border-brand-400'}`}
          >
            Vše
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSearchParams(p => { p.set('category', cat.slug); return p; })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${categorySlug === cat.slug ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 text-slate-600 hover:border-brand-400'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center py-12 text-slate-400">Načítám...</div>}

      {!isLoading && data?.products.length === 0 && (
        <div className="text-center py-12 text-slate-400">Žádné produkty nenalezeny.</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.products.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/products/${product.slug}`}>
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-300 text-4xl">📦</span>
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link to={`/products/${product.slug}`} className="font-medium text-sm hover:text-brand-600 line-clamp-2">
                {product.name}
              </Link>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-brand-600">{formatPrice(product.priceCzk)}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-40 transition-colors"
                  title="Přidat do košíku"
                >
                  <ShoppingCart size={14} />
                </button>
              </div>
              {product.stock === 0 && <p className="text-xs text-red-500 mt-1">Není skladem</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
