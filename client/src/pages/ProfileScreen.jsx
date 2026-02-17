import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { Package, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(() => (user?.name || ''));
  const [email, setEmail] = useState(() => (user?.email || ''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      const fetchMyOrders = async () => {
        try {
          setLoadingOrders(true);
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data } = await api.get('/orders/myorders', config);
          setOrders(data);
          setLoadingOrders(false);
        } catch (err) {
          setErrorOrders(err.response && err.response.data.message ? err.response.data.message : err.message);
          setLoadingOrders(false);
        }
      };
      fetchMyOrders();
    }
  }, [user, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('profile.passwords_mismatch'));
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.put(
        '/users/profile',
        { name, email, password },
        config
      );

      updateUser(data);
      toast.success(t('profile.update_success'));
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message;
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Update Form */}
        <div className="lg:col-span-1">
          <h2 className="text-3xl font-serif text-gray-900 mb-6">{t('profile.title')}</h2>
          <form onSubmit={submitHandler} className="card-strong p-8 space-y-6 ring-1 ring-transparent hover:ring-primary/20 transition-all">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t('profile.name')}</label>
              <input
                type="text"
                id="name"
                placeholder={t('profile.name_placeholder')}
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('profile.email')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('profile.email_placeholder')}
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">{t('profile.password')}</label>
              <input
                type="password"
                id="password"
                placeholder={t('profile.enter_password_placeholder')}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">{t('profile.confirm_password')}</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder={t('profile.confirm_password_placeholder')}
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
            >
              {t('profile.update_btn')}
            </button>
          </form>
        </div>

        {/* My Orders Section */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-serif text-gray-900 mb-6">{t('profile.my_orders')}</h2>
          {loadingOrders ? (
            <div className="text-center text-lg text-gray-600">{t('profile.loading_orders')}</div>
          ) : errorOrders ? (
            <div className="card p-3 text-red-700 ring-1 ring-red-200 bg-red-50/60">{errorOrders}</div>
          ) : (
            <div className="card-strong p-8 ring-1 ring-transparent hover:ring-primary/20 transition-all">
              {orders.length === 0 ? (
                <div className="text-center text-lg text-gray-600">{t('profile.no_orders')}</div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order._id} className="card p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">{t('profile.order')} {order._id}</h3>
                        <Link to={`/order/${order._id}`} className="text-primary hover:underline">
                          {t('profile.view_details')}
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
                        <p className="flex items-center"><Calendar className="mr-2" size={16} /> {t('profile.date')}: {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="flex items-center"><DollarSign className="mr-2" size={16} /> {t('profile.total')}: ${order.totalPrice.toFixed(2)}</p>
                        <p className="flex items-center">
                          {order.isPaid ? (
                            <><CheckCircle className="mr-2 text-green-500" size={16} /> {t('profile.paid_on', { date: new Date(order.paidAt).toLocaleDateString() })}</>
                          ) : (
                            <><XCircle className="mr-2 text-red-500" size={16} /> {t('profile.not_paid')}</>
                          )}
                        </p>
                        <p className="flex items-center">
                          {order.isDelivered ? (
                            <><CheckCircle className="mr-2 text-green-500" size={16} /> {t('profile.delivered_on', { date: new Date(order.deliveredAt).toLocaleDateString() })}</>
                          ) : (
                            <><XCircle className="mr-2 text-red-500" size={16} /> {t('profile.not_delivered')}</>
                          )}
                        </p>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-md font-medium text-gray-800 mb-2">{t('profile.items')}:</h4>
                        <ul className="list-disc list-inside text-gray-600">
                          {order.orderItems.map(item => (
                            <li key={item.product}>
                              {item.qty} x {item.name} (${item.price.toFixed(2)} {t('profile.each')})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
