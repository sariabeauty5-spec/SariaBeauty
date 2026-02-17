import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2, ArrowRight, Minus, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from 'react-i18next';

const Cart = () => {
  const { t } = useTranslation();
  const { cartItems, removeFromCart, incrementQty, decrementQty } = useCart();
  const { formatPrice } = useCurrency();
  const [deleteId, setDeleteId] = useState(null);
  
  const resolveImage = (img) => {
    if (!img) return '';
    const lower = img.toLowerCase();
    if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
    return `/images/${img}`;
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    let key = cat.toLowerCase();
    
    return t(`category.${key}`, { defaultValue: cat });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  if (cartItems.length === 0) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">{t('cart.empty.title')}</h1>
          <p className="text-gray-600 max-w-md mx-auto mb-8">{t('cart.empty.message')}</p>
          <Link to="/shop" className="btn btn-primary rounded-full px-8 py-4 font-semibold text-base">
            {t('cart.empty.action')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="relative bg-rose-100/50 pt-32 pb-20 lg:pt-48 lg:pb-28">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-repeat bg-center" style={{ backgroundImage: 'url(/images/patterns/subtle-dots.svg)' }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif text-gray-900 mb-4">{t('cart.title')}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">{t('cart.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-6">
                <div className="w-28 h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                  <img src={resolveImage(item.image)} alt={item.name} className="max-h-full max-w-full object-contain p-2 transition-all duration-300 hover:scale-105" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{getCategoryLabel(item.category)}</p>
                  <div className="flex items-center">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => decrementQty(item._id)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="mx-4 w-8 text-center text-gray-800 font-semibold text-lg">{item.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => incrementQty(item._id)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-primary mb-2">{formatPrice(item.price * item.qty)}</p>
                  <button 
                    onClick={() => setDeleteId(item._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer relative z-10"
                    title={t('cart.delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-28">
            <h2 className="text-2xl font-serif text-gray-900 mb-6">{t('cart.summary.title')}</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.summary.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.summary.shipping')}</span>
                <span className="font-semibold">{t('cart.summary.free')}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between font-bold text-xl text-gray-900">
                <span>{t('cart.summary.total')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Link 
              to="/checkout"
              className="btn btn-primary w-full py-4 text-lg rounded-full font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-3"
            >
              {t('cart.checkout')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            removeFromCart(deleteId);
            setDeleteId(null);
          }
        }}
        title={t('cart.confirm.title')}
        message={t('cart.confirm.message')}
        icon={Trash2}
      />
    </main>
  );
};

export default Cart;
