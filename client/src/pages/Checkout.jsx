import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../context/CurrencyContext';
import { CreditCard, MapPin, Package } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPayPalReady, setIsPayPalReady] = useState(false);

  const resolveImage = (img) => {
    if (!img) return '';
    const lower = img.toLowerCase();
    if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
    return `/images/${img}`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    const getStripeKey = async () => {
      try {
        const { data } = await api.get('/payment/config');
        setStripePromise(loadStripe(data.publishableKey));
      } catch {
        toast.error(t('checkout.errors.payment_init_failed'));
      }
    };
    getStripeKey();
  }, [user, cartItems, navigate, t]);

  const itemsPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const shippingPrice = 0;
  const taxPrice = 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  useEffect(() => {
    if (!user || !user.token) return;
    if (paymentMethod !== 'Stripe') return;
    if (totalPrice <= 0) return;
    const createPaymentIntent = async () => {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await api.post('/payment/create-payment-intent', { amount: totalPrice }, config);
        setClientSecret(data.clientSecret);
      } catch {
        toast.error(t('checkout.errors.payment_init_failed'));
      }
    };
    createPaymentIntent();
  }, [paymentMethod, totalPrice, user, t]);

  useEffect(() => {
    if (paymentMethod !== 'PayPal') return;
    if (totalPrice <= 0) return;
    if (isPayPalReady) return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      toast.error(t('checkout.errors.paypal_not_configured'));
      return;
    }
    let cancelled = false;
    const setupPayPal = () => {
      if (cancelled) return;
      if (window.paypal) {
        setIsPayPalReady(true);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=AED`;
      script.async = true;
      script.onload = () => {
        if (!cancelled) {
          setIsPayPalReady(true);
        }
      };
      script.onerror = () => {
        if (!cancelled) {
          toast.error(t('checkout.errors.payment_unexpected'));
        }
      };
      document.body.appendChild(script);
    };
    setupPayPal();
    return () => {
      cancelled = true;
    };
  }, [paymentMethod, totalPrice, isPayPalReady, t]);

  const placeOrderHandler = async (paymentResult = {}, isPaidOverride = null) => {
    try {
      if (!user || !user.token) {
        navigate('/login?redirect=/checkout');
        return;
      }
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const isStripePaid =
        paymentMethod === 'Stripe' &&
        (paymentResult.status === 'succeeded' || paymentResult.status === 'requires_capture');
      const isPaid = typeof isPaidOverride === 'boolean' ? isPaidOverride : isStripePaid;
      const paidAt = isPaid ? new Date() : null;
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          qty: item.qty,
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: itemsPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        paymentResult,
        isPaid,
        paidAt,
      };
      const { data } = await api.post('/orders', orderData, config);
      clearCart();
      toast.success(t('checkout.success.order_placed'));
      navigate(`/order-success/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || t('checkout.errors.order_failed'));
    }
  };

  const onStripePaymentSuccess = (paymentIntent) => {
    const paymentResult = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      update_time: new Date().toISOString(),
      email_address: paymentIntent.receipt_email,
    };
    placeOrderHandler(paymentResult);
  };

  const onStripePaymentError = (errorMessage) => {
    toast.error(errorMessage);
  };

  const isShippingComplete =
    shippingAddress.address.trim() &&
    shippingAddress.city.trim() &&
    shippingAddress.postalCode.trim() &&
    shippingAddress.country.trim();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif text-gray-900 mb-10 text-center">{t('checkout.title')}</h1>
      <div className="max-w-4xl mx-auto card-strong p-8 ring-1 ring-transparent hover:ring-primary/20 transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-serif text-gray-800 mb-6 flex items-center">
                <MapPin className="mr-3" /> {t('checkout.shipping.title')}
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.shipping.address_label')}
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="input"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.shipping.city_label')}
                    </label>
                    <input
                      type="text"
                      id="city"
                      className="input"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.shipping.postal_code_label')}
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      className="input"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.shipping.country_label')}
                  </label>
                  <input
                    type="text"
                    id="country"
                    className="input"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-serif text-gray-800 mb-6 flex items-center">
                <CreditCard className="mr-3" /> {t('checkout.payment.title')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="stripe"
                    name="paymentMethod"
                    value="Stripe"
                    checked={paymentMethod === 'Stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="stripe" className="ml-3 block text-base font-medium text-gray-700">
                    {t('checkout.payment.stripe')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="PayPal"
                    checked={paymentMethod === 'PayPal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="paypal" className="ml-3 block text-base font-medium text-gray-700">
                    {t('checkout.payment.paypal')}
                  </label>
                </div>
              </div>
              <div className="mt-6">
                {paymentMethod === 'Stripe' && (
                  <>
                    {(!stripePromise || !clientSecret) && (
                      <div className="w-full flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                    {stripePromise && clientSecret && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripePaymentForm
                          onPaymentSuccess={onStripePaymentSuccess}
                          onPaymentError={onStripePaymentError}
                          isProcessing={isProcessing}
                          setIsProcessing={setIsProcessing}
                        />
                      </Elements>
                    )}
                  </>
                )}
                {paymentMethod === 'PayPal' && (
                  <div className="w-full flex justify-center py-2">
                    {isPayPalReady ? (
                      <div id="paypal-button-container" className="w-full flex justify-center" />
                    ) : (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 ring-1 ring-transparent hover:ring-primary/20 transition-all">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">
                {t('checkout.summary.title')}
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t('checkout.summary.items')}</span>
                  <span>{formatPrice(itemsPrice)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg text-gray-900">
                  <span>{t('checkout.summary.total')}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-gray-600 text-sm">
                  <Package className="w-4 h-4 mr-2" />
                  <span>{t('checkout.review.order_items')}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center shadow-inner mr-3">
                          <img src={resolveImage(item.image)} alt={item.name} className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-gray-700 text-xs">
                          {item.name} x {item.qty}
                        </span>
                      </div>
                      <span className="text-gray-800 font-medium text-sm">
                        {formatPrice(item.qty * item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {!isShippingComplete && (
                <p className="mt-4 text-xs text-red-500">
                  {t('checkout.shipping.continue_btn')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
