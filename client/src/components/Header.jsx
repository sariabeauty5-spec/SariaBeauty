import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Search, Menu, User, LogOut, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { useCurrency } from '../context/CurrencyContext';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import siteLogo from '../../logo/logoSaaria_page-0001-removebg-preview.png';
import SearchModal from './SearchModal';
import ConfirmModal from './ConfirmModal';

const Header = () => {
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const logoUrl = siteLogo;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  const navItems = useMemo(() => ([
    { to: '/', labelKey: 'nav.home' },
    { to: '/shop', labelKey: 'nav.shop' },
    { to: '/reviews', labelKey: 'nav.reviews' },
    { to: '/about', labelKey: 'nav.about' },
    { to: '/contact', labelKey: 'nav.contact' },
    ...(user?.isAdmin ? [{ to: '/admin', labelKey: 'nav.admin' }] : []),
  ]), [user?.isAdmin]);

  return (
    <header className={clsx(
      "sticky top-0 z-50 transition-all duration-200",
      isScrolled ? "bg-white/90 shadow-sm border-b border-rose-100" : "bg-transparent border-b border-transparent"
    )}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Mobile Menu */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Saria Beauty"
              className="h-10 w-auto object-contain"
              loading="eager"
            />
          ) : (
            <span className="text-3xl font-serif font-bold text-primary tracking-wide">
              SARIA BEAUTY
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-2 rtl:space-x-reverse">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                  isActive 
                    ? 'bg-rose-100 text-primary'
                    : 'text-gray-600 hover:bg-rose-50 hover:text-primary'
                )
              }
            >
              {i18n.t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Icons & Lang Switch */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
           <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium">
            <button onClick={() => changeLanguage('en')} className={`hover:text-primary ${i18n.language === 'en' ? 'text-primary' : 'text-gray-500'}`}>EN</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => changeLanguage('fr')} className={`hover:text-primary ${i18n.language === 'fr' ? 'text-primary' : 'text-gray-500'}`}>FR</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => changeLanguage('ar')} className={`hover:text-primary ${i18n.language === 'ar' ? 'text-primary' : 'text-gray-500'}`}>AR</button>
          </div>

          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium border-l border-r px-3 border-gray-200" dir="ltr">
            <button onClick={() => setCurrency('AED')} className={`hover:text-primary ${currency === 'AED' ? 'text-primary' : 'text-gray-500'}`}>AED</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setCurrency('USD')} className={`hover:text-primary ${currency === 'USD' ? 'text-primary' : 'text-gray-500'}`}>$</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setCurrency('EUR')} className={`hover:text-primary ${currency === 'EUR' ? 'text-primary' : 'text-gray-500'}`}>€</button>
          </div>

          <Motion.button  
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            type="button" 
            onClick={() => setSearchOpen(true)} 
            className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2"
          >
            <Search className="w-5 h-5" />
          </Motion.button>
          
          {user ? (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/profile" className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2 block" title="Profile">
                  <User className="w-5 h-5" />
                </Link>
              </Motion.div>
              <span className="text-sm font-medium text-primary hidden md:block">{user.name}</span>
              <Motion.button 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLogoutConfirmOpen(true)} 
                className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2" 
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Motion.button>
            </div>
          ) : (
            <Motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link to="/login" className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2 block">
                <User className="w-5 h-5" />
              </Link>
            </Motion.div>
          )}

          <Motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
            <Link to="/cart" className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2 block">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <Motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </Motion.span>
              )}
            </Link>
          </Motion.div>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => { logout(); setLogoutConfirmOpen(false); }}
        title={i18n.t('confirm.logout_title')}
        message={i18n.t('confirm.logout_message')}
      />

      <AnimatePresence>
        {mobileOpen && (
          <Motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <Motion.div
              id="mobile-menu"
              className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-rose-100 shadow-lg"
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Saria Beauty" className="h-9 w-auto object-contain" />
                  ) : (
                    <span className="text-2xl font-serif font-bold text-primary tracking-wide">SARIA BEAUTY</span>
                  )}
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-700 hover:text-gray-900 hover:bg-rose-50 transition-colors rounded-xl p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="container mx-auto px-4 pb-6">
                <nav className="grid gap-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'rounded-2xl px-4 py-3 text-base font-medium transition-colors',
                          isActive ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-700 hover:bg-rose-50'
                        )
                      }
                    >
                  {i18n.t(item.labelKey)}
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <button onClick={() => changeLanguage('en')} className={clsx('px-3 py-2 rounded-full transition-colors', i18n.language === 'en' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>EN</button>
                      <button onClick={() => changeLanguage('fr')} className={clsx('px-3 py-2 rounded-full transition-colors', i18n.language === 'fr' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>FR</button>
                      <button onClick={() => changeLanguage('ar')} className={clsx('px-3 py-2 rounded-full transition-colors', i18n.language === 'ar' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>AR</button>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium" dir="ltr">
                      <button onClick={() => setCurrency('AED')} className={clsx('px-3 py-2 rounded-full transition-colors', currency === 'AED' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>AED</button>
                      <button onClick={() => setCurrency('USD')} className={clsx('px-3 py-2 rounded-full transition-colors', currency === 'USD' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>$</button>
                      <button onClick={() => setCurrency('EUR')} className={clsx('px-3 py-2 rounded-full transition-colors', currency === 'EUR' ? 'bg-rose-50 text-gray-900 ring-1 ring-rose-200/70' : 'text-gray-600 hover:bg-rose-50')}>€</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {user ? (
                      <div className="flex items-center gap-2 w-full">
                        <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-full px-4 py-2 bg-white text-gray-800 ring-1 ring-gray-200 shadow-sm hover:bg-rose-50">
                          Profile
                        </Link>
                        <button onClick={() => { setMobileOpen(false); setLogoutConfirmOpen(true); }} className="flex-1 rounded-full px-4 py-2 bg-primary text-white shadow-sm hover:bg-rose-700">
                          Logout
                        </button>
                      </div>
                    ) : (
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center rounded-full px-4 py-2 bg-primary text-white shadow-sm hover:bg-rose-700">
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
