import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';

// Lazy loading for pages
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const OrderSuccessScreen = lazy(() => import('./pages/OrderSuccessScreen'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Shop = lazy(() => import('./pages/Shop'));
const Reviews = lazy(() => import('./pages/Reviews'));

// Non-lazy components that are small or needed immediately
import ChatAssistant from './components/ChatAssistant';
import Footer from './components/Footer';
import RequireAdmin from './components/RequireAdmin';

const NotFound = ({ t }) => (
  <main>
    <div className="container mx-auto px-4 py-24 text-center">
      <h2 className="text-4xl font-serif text-gray-900 mb-4">{t('not_found.title')}</h2>
      <p className="text-gray-600 mb-8">{t('not_found.message')}</p>
      <Link to="/" className="btn btn-primary inline-flex">{t('not_found.back_home')}</Link>
    </div>
  </main>
);

const ConditionalFooter = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Footer />;
};

function App() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);



  return (
    <Router>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          className: 'glass-toast',
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(183, 110, 121, 0.2)',
            padding: '16px 24px',
            color: '#1f2937',
            borderRadius: '24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#B76E79',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #B76E79',
            }
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #e11d48',
            }
          },
        }}
      />
      <div className="min-h-screen font-sans">
        <Header />
        <ChatAssistant />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/order-success/:id" element={<OrderSuccessScreen />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="*" element={<NotFound t={t} />} />
            {/* Add more routes here */}
          </Routes>
        </Suspense>
        <ConditionalFooter />
      </div>
    </Router>
  );
}

export default App;
