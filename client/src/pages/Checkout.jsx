import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronLeft, CreditCard, MapPin, Package, CheckCircle } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(1); // 1: Shipping, 2: Payment, 3: Place Order
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
    }
    if (cartItems.length === 0) {
      navigate('/cart');
    }

    // Load Stripe key
    const getStripeKey = async () => {
      const { data } = await api.get('/payment/config');
      setStripePromise(loadStripe(data.publishableKey));
    };
    getStripeKey();
  }, [user, cartItems, navigate]);

  const itemsPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const shippingPrice = 0; // Free shipping
  const taxPrice = 0; // No tax
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  useEffect(() => {
    if (!user || !user.token) return;
    if (activeStep === 3 && paymentMethod === 'Stripe' && !clientSecret && totalPrice > 0) {
      const createPaymentIntent = async () => {
        try {
          console.log('Creating payment intent with amount:', totalPrice);
          const config = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data } = await api.post('/payment/create-payment-intent', { amount: totalPrice }, config);
          setClientSecret(data.clientSecret);
        } catch (error) {
          console.error('Failed to create payment intent', error);
          toast.error(error.response?.data?.message || t('checkout.errors.payment_init_failed'));
        }
      };
      createPaymentIntent();
    }
  }, [activeStep, paymentMethod, totalPrice, user, clientSecret, t]);

  useEffect(() => {
    if (activeStep === 3 && paymentMethod === 'PayPal' && !isPayPalReady && totalPrice > 0) {
      if (window.paypal) {
        setIsPayPalReady(true);
        return;
      }
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      if (!clientId) {
        toast.error(t('checkout.errors.paypal_not_configured'));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=AED`;
      script.async = true;
      script.onload = () => setIsPayPalReady(true);
      script.onerror = () => {
        toast.error(t('checkout.errors.payment_unexpected'));
      };
      document.body.appendChild(script);
    }
  }, [activeStep, paymentMethod, isPayPalReady, totalPrice, t]);

  const submitShippingHandler = (e) => {
    e.preventDefault();
    // In a real app, you'd save this to user profile or session
    setActiveStep(2);
  };

  const submitPaymentHandler = (e) => {
    e.preventDefault();
    // In a real app, you'd save this to session
    setActiveStep(3);
  };

  const placeOrderHandler = async (paymentResult = {}, isPaidOverride = null) => {
    try {
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
      navigate(`/order-success/${data._id}`); // Redirect to a success page or order details
    } catch (error) {
      console.error('Order placement failed:', error);
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

  useEffect(() => {
    if (activeStep === 3 && paymentMethod === 'PayPal' && isPayPalReady && totalPrice > 0 && window.paypal) {
      const container = document.getElementById('paypal-button-container');
      if (!container || container.children.length > 0) return;

      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: totalPrice.toFixed(2),
                },
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          setIsProcessing(true);
          try {
            const details = await actions.order.capture();
            const paymentResult = {
              id: details.id,
              status: details.status,
              update_time: details.update_time,
              email_address: details.payer && details.payer.email_address,
            };
            await placeOrderHandler(paymentResult, true);
          } catch (err) {
            toast.error(err.message || t('checkout.errors.payment_unexpected'));
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (err) => {
          toast.error(err.message || t('checkout.errors.payment_unexpected'));
        },
      }).render('#paypal-button-container');
    }
  }, [activeStep, paymentMethod, isPayPalReady, totalPrice, placeOrderHandler, t]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif text-gray-900 mb-10 text-center">Checkout</h1>

      <div className="max-w-4xl mx-auto card-strong p-8 ring-1 ring-transparent hover:ring-primary/20 transition-all">
        {/* Progress Stepper */}
        <div className="flex justify-between items-center mb-10 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out rounded-full" 
              style={{ width: `${(activeStep - 1) / 2 * 100}%` }}
            ></div>
          </div>
          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full ring-2 ring-white shadow flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                activeStep >= step ? 'bg-primary' : 'bg-gray-300'
              }`}>
                {activeStep > step ? <CheckCircle size={20} /> : step}
              </div>
              <span className={`mt-2 text-sm font-medium ${activeStep >= step ? 'text-primary' : 'text-gray-500'}`}>
                {step === 1 && t('checkout.steps.shipping')}
                {step === 2 && t('checkout.steps.payment')}
                {step === 3 && t('checkout.steps.place_order')}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {activeStep === 1 && (
              <form onSubmit={submitShippingHandler} className="space-y-6">
                <h2 className="text-2xl font-serif text-gray-800 mb-6 flex items-center"><MapPin className="mr-3" /> {t('checkout.shipping.title')}</h2>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.shipping.address_label')}</label>
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
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.shipping.city_label')}</label>
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
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.shipping.postal_code_label')}</label>
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
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.shipping.country_label')}</label>
                  <input
                    type="text"
                    id="country"
                    className="input"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  {t('checkout.shipping.continue_btn')}
                </button>
              </form>
            )}

            {/* Payment Step */}
            {activeStep === 2 && (
              <form onSubmit={submitPaymentHandler} className="space-y-6">
                <h2 className="text-2xl font-serif text-gray-800 mb-6 flex items-center"><CreditCard className="mr-3" /> {t('checkout.payment.title')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="stripe"
                      name="paymentMethod"
                      value="Stripe"
                      checked={paymentMethod === 'Stripe'}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setActiveStep(3);
                      }}
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
                <div className="flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(1)} 
                    className="btn btn-soft w-1/2"
                  >
                    <ChevronLeft className="mr-2" size={20} /> {t('checkout.payment.back_btn')}
                  </button>
                  <button type="submit" className="btn btn-primary w-1/2">
                    {t('checkout.payment.continue_btn')}
                  </button>
                </div>
              </form>
            )}

            {/* Place Order / Payment Details Step */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif text-gray-800 mb-6 flex items-center">
                  <Package className="mr-3" />
                  {paymentMethod === 'Stripe' ? t('checkout.review.title_card') : t('checkout.review.title')}
                </h2>
                
                {/* Shipping Info */}
                <div className="card p-5">
                  <h3 className="text-xl font-medium text-gray-800 mb-3">{t('checkout.review.shipping_info')}</h3>
                  <p className="text-gray-600">{shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}</p>
                </div>

                {/* Payment Info */}
                <div className="card p-5">
                  <h3 className="text-xl font-medium text-gray-800 mb-3">{t('checkout.review.payment_method')}</h3>
                  <p className="text-gray-600">{paymentMethod}</p>
                </div>

                {/* Order Items */}
                <div className="card p-5">
                  <h3 className="text-xl font-medium text-gray-800 mb-3">{t('checkout.review.order_items')}</h3>
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center shadow-inner mr-3">
                          <img src={resolveImage(item.image)} alt={item.name} className="w-10 h-10 object-contain transition-all duration-300 hover:scale-105" />
                        </div>
                        <span className="text-gray-700 text-sm">{item.name} x {item.qty}</span>
                      </div>
                      <span className="text-gray-800 font-medium">{formatPrice(item.qty * item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(2)} 
                    className="btn btn-soft w-1/2"
                  >
                    <ChevronLeft className="mr-2" size={20} /> {t('checkout.review.back_btn')}
                  </button>
                  {paymentMethod === 'Stripe' && (
                    clientSecret && stripePromise ? (
                      <div className="w-full">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripePaymentForm 
                            onPaymentSuccess={onStripePaymentSuccess}
                            onPaymentError={onStripePaymentError}
                            isProcessing={isProcessing}
                            setIsProcessing={setIsProcessing}
                          />
                        </Elements>
                      </div>
                    ) : (
                      <div className="w-full flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )
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
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 ring-1 ring-transparent hover:ring-primary/20 transition-all">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">{t('checkout.summary.title')}</h2>
              
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
