import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import toast from 'react-hot-toast';
import './FoundersToastProductDetail.css';

const FoundersToastProductDetail = () => {
  const [product, setProduct] = useState(null);
  const [buttonText, setButtonText] = useState('Add to Cart');
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const productId = 'founders-toast';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, []);

  const isInCart = cart.some(
    (item) => item.id === (product?.stripePriceId || `simple-${productId}`)
  );

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: product?.stripePriceId || `simple-founders-toast`,
      productId: 'founders-toast',
      name: product?.name || 'Founder’s Toast™',
      quantity,
      price: product?.price || 1200,
      stripePriceId: product?.stripePriceId || '',
      images: product?.images?.length ? [product.images[0]] : [],
      image:
        typeof product.images?.[0] === 'string'
          ? product.images[0]
          : product.images?.[0]?.src,
      category: 'artisan',
      currentQuantity: product?.currentQuantity ?? 10,
    };

    const existingItem = cart.find((item) => item.id === cartItem.id);

    const updatedCartItem = {
      ...cartItem,
      quantity: existingItem
        ? Math.min(
            existingItem.quantity + quantity,
            product.currentQuantity ?? 10
          )
        : quantity,
    };

    addToCart(updatedCartItem);
    toast.success('🛒 Item added to cart!');
    setButtonText('In Cart');
  };

  const handleRemove = () => {
    const itemId = product?.stripePriceId || `simple-${productId}`;
    removeFromCart(itemId);
    toast.success('🗑️ Removed from cart.');
    setButtonText('Add to Cart');
  };

  useEffect(() => {
    setButtonText(isInCart ? 'In Cart' : 'Add to Cart');
  }, [isInCart]);

  if (!product) {
    return <div className="founders-toast-loading">Loading...</div>;
  }

  return (
    <div className="founders-toast-detail">
      <img
        src="/resized-logos/founders-toast-white.png"
        alt="Founder’s Toast Logo"
        className="founders-toast-header-image"
      />

      <div className="founders-toast-content">
        <div className="founders-toast-image">
          <img
            src={
              typeof product.images?.[0] === 'string'
                ? product.images[0]
                : product.images?.[0]?.src ||
                  '/fallback-images/fallback_image1.png'
            }
            alt={product.name}
          />
        </div>

        <div className="founders-toast-details">
          <span>
            Formulated by hand in small batches, <strong>Founder’s Toast™</strong> is a
            nourishing blend of natural oils and hand-melted beeswax crafted to{' '}
            <strong>lubricate, protect, and enhance wooden bearing edges</strong>. It
            promotes a smooth, consistent drumhead-to-shell interface — helping shells
            speak freely, with improved sensitivity and tonal clarity.
          </span>

          <span>
            Beyond bearing edges, Founder’s Toast also <strong>seconds as a conditioning
            polish</strong> for raw, satin, or matte-finished woods such as walnut,
            cherry, birch, oak, or maple. The subtle smoky-vanilla aroma and natural sheen
            bring warmth and depth to fine woods without adding unwanted gloss.
          </span>

          <span>
            <strong>Recommended Use:</strong> Apply sparingly to clean bearing edges using
            a soft cloth or fingertip. Buff lightly until smooth. Suitable for use on most
            wooden bearing edges and unfinished or matte shell exteriors.
          </span>

          <span>
            <strong>Important:</strong> Not recommended for use on high-gloss, lacquered,
            or polyurethane-coated finishes. Always test on an inconspicuous area first.
            While Founder’s Toast has shown excellent results in both Ober and non-Ober
            drums during testing, individual results may vary depending on wood species
            and finish condition.
          </span>

          <div>
            <p className="founders-toast-price">
              ${Number(product.price).toFixed(2)}
            </p>
            <p className="founders-toast-eta">Est Delivery: 5–7 business days</p>
          </div>

          {buttonText === 'In Cart' ? (
            <div className="artisan-cart-hover-container">
              <button className="artisan-in-cart-button" disabled>
                ✔ In Cart
              </button>
              <div className="artisan-cart-hover-options">
                <span onClick={() => navigate('/cart')}>View Cart</span>
                <span onClick={handleRemove}>Remove</span>
              </div>
            </div>
          ) : (
            <button
              className="artisan-add-to-cart-button"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoundersToastProductDetail;