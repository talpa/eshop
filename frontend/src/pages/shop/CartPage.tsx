import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const token = useAuthStore(s => s.token);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Košík je prázdný</h2>
        <Link to="/products" className="text-brand-600 hover:underline text-sm">Pokračovat v nákupu</Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!token) { navigate('/login'); return; }
    navigate('/checkout');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Košík</h1>
      <div className="space-y-3 mb-6">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
              {product.images[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-2xl">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${product.slug}`} className="font-medium text-sm hover:text-brand-600 line-clamp-1">{product.name}</Link>
              <p className="text-brand-600 font-bold text-sm">{formatPrice(product.priceCzk)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 border border-slate-300 rounded hover:bg-slate-100"><Minus size={12} /></button>
              <span className="w-6 text-center text-sm">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"><Plus size={12} /></button>
            </div>
            <p className="text-sm font-semibold w-20 text-right">{formatPrice(Number(product.priceCzk) * quantity)}</p>
            <button onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Celkem</span>
          <span className="text-xl font-bold text-brand-600">{formatPrice(total())}</span>
        </div>
        <button onClick={handleCheckout} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium transition-colors">
          Pokračovat k objednávce
        </button>
        <Link to="/products" className="block text-center text-sm text-slate-500 hover:text-slate-800 mt-3">
          Pokračovat v nákupu
        </Link>
      </div>
    </div>
  );
}
