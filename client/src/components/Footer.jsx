import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSocialMediaUrl } from '../config/socialLinks';
import { toast } from 'react-hot-toast';

const Footer = () => {
  const { t } = useTranslation();

  const handleSocialClick = (platform) => {
    toast.success(`Opening ${platform} in a new tab...`);
  };
  return (
    <footer className="bg-rose-50/50 border-t border-rose-100">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Link to="/" className="text-2xl font-serif font-bold text-primary tracking-wide">SARIA BEAUTY</Link>
            <p className="mt-4 text-gray-600 max-w-xs">
              {t('footer.paragraph')}
            </p>
            <div className="mt-6 flex items-center space-x-4 rtl:space-x-reverse">
              <a href={getSocialMediaUrl('instagram')} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 hover:text-primary transition-colors" onClick={() => handleSocialClick('Instagram')}><Instagram /></a>
              <a href={getSocialMediaUrl('facebook')} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-500 hover:text-primary transition-colors" onClick={() => handleSocialClick('Facebook')}><Facebook /></a>
              <a href={getSocialMediaUrl('whatsapp')} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-gray-500 hover:text-primary transition-colors" onClick={() => handleSocialClick('WhatsApp')}><MessageCircle /></a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-3 text-gray-600">
              <li><Link to="/shop" className="hover:text-primary transition-colors">{t('footer.shop')}</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
              <li><Link to="/reviews" className="hover:text-primary transition-colors">{t('footer.reviews')}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.support')}</h4>
            <ul className="space-y-3 text-gray-600">
              <li><Link to="/profile" className="hover:text-primary transition-colors">{t('footer.my_account')}</Link></li>
              <li><Link to="/cart" className="hover:text-primary transition-colors">{t('footer.cart')}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t('footer.faq')}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.newsletter_title')}</h4>
            <p className="text-gray-600 mb-4">{t('footer.newsletter_desc')}</p>
            <form className="flex">
              <input
                type="email"
                placeholder={t('footer.email_placeholder')}
                className="input rounded-r-none flex-grow"
              />
              <button className="btn btn-primary rounded-l-none">
                <Mail className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-rose-200/50 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Saria Beauty. {t('footer.rights')}</p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6 rtl:space-x-reverse">
            <Link to="#" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
            <Link to="#" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
