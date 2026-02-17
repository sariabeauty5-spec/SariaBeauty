import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, Star, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [newReviewNotification, setNewReviewNotification] = useState(false);
  const [newReviewIds, setNewReviewIds] = useState([]);
  const resolveImage = (img) => {
    if (!img) return '';
    const lower = img.toLowerCase();
    if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
    return `/images/${img}`;
  };
  const displayFields = (p) => {
    const lang = i18n.language || 'en';
    const trans = (p.translations || {})[lang];
    const name = trans?.name || p.name;
    const description = trans?.description || p.description;
    return { name, description };
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Set up real-time review updates using EventSource
    const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
    const es = new EventSource(`${baseUrl}/api/products/events`);

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // Check if this is a review update for our product
        if (payload.channel === 'product' && payload.type === 'review_created' && payload.productId === id) {
          // Refresh product data to get updated reviews
          fetchProduct();
          // Show notification
          setNewReviewNotification(true);
          // Hide notification after 3 seconds
          setTimeout(() => setNewReviewNotification(false), 3000);
          // Track the new review ID for highlighting
          if (payload.review && payload.review._id) {
            setNewReviewIds(prev => [...prev, payload.review._id]);
            // Remove the highlight after 5 seconds
            setTimeout(() => {
              setNewReviewIds(prev => prev.filter(id => id !== payload.review._id));
            }, 5000);
          }
        }
      } catch (err) {
        console.warn('SSE parse error', err);
      }
    };

    es.onerror = (err) => {
      console.warn('SSE connection error', err);
    };

    return () => {
      es.close();
    };
  }, [id]);

  if (loading) return <div className="text-center py-20 text-primary">{t('product.loading')}</div>;
  if (!product) return <div className="text-center py-20">{t('product.not_found')}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
        {t('back_to_shop')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <div className="card p-4 ring-1 ring-transparent hover:ring-primary/20 transition-all">
          <div className="h-[28rem] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            <img 
              src={resolveImage(product.image)} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain transition-all duration-700 ease-out hover:scale-105 hover:rotate-1"
            />
            <span className="absolute top-3 left-3 bg-rose-50/80 text-gray-900 text-xs px-3 py-1 rounded-full border border-rose-200/70 backdrop-blur-md">{product.category}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium tracking-wider uppercase">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mt-2 mb-2">{displayFields(product).name}</h1>
            <div className="h-0.5 w-24 bg-primary/30 rounded mb-4" />
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-gray-500 ml-2 rtl:mr-2 text-sm">{t('product.reviews_label', { count: product.numReviews })}</span>
            </div>
            <p className="text-2xl font-bold text-primary"><span className="tabular-nums">{formatPrice(product.price)}</span></p>
          </div>

          <div className="text-gray-700 leading-relaxed mb-8">{displayFields(product).description}</div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
             <button 
               onClick={() => addToCart(product)}
               className="btn btn-primary flex-1 py-4 shadow-lg hover:shadow-xl"
               disabled={product.countInStock === 0}
             >
               <ShoppingBag className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
               {product.countInStock > 0 ? t('add_to_cart') : t('out_of_stock')}
             </button>
             <button type="button" className="btn btn-outline w-12 h-12 p-0 rounded-full text-gray-500 hover:text-red-600 hover:border-red-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
             </button>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-8">
             <div className="flex items-center space-x-8 rtl:space-x-reverse text-sm text-gray-500">
                <div className="flex items-center">
                   <span className={`w-2 h-2 rounded-full mr-2 rtl:ml-2 rtl:mr-0 ${product.countInStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                   {product.countInStock > 0 ? t('in_stock') : t('out_of_stock')}
                </div>
                <div>
                   {t('fast_delivery')}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <div className="border-t border-gray-200 pt-12">
            {/* New Review Notification */}
            {newReviewNotification && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">New review added!</p>
                  <p className="text-sm text-green-700">A new review has been posted for this product.</p>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-serif text-gray-900 mb-8">Customer Reviews</h2>
            
            {/* Review Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-6 h-6 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Based on {product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'}</p>
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {product.reviews.map((review, index) => (
                <div key={index} className={`bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 ${
                  newReviewIds.includes(review._id) ? 'new-review-highlight' : ''
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.name}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Reviews Message */}
      {(!product.reviews || product.reviews.length === 0) && (
        <div className="mt-16">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-serif text-gray-900 mb-4">Customer Reviews</h2>
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
