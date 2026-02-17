import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, icon }) => {
  const { t } = useTranslation();
  const IconComponent = icon || LogOut;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <IconComponent className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-4">{title}</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={onClose}
                  className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-full px-8 py-3 font-semibold"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={onConfirm}
                  className="btn btn-primary rounded-full px-8 py-3 font-semibold"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
