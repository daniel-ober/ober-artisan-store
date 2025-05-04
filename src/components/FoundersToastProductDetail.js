// FoundersToastProductDetail.js
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

  const isInCart = cart.some((item) => item.id === (product?.stripePriceId || `simple-${productId}`));

  const cartItem = {
    id: product?.stripePriceId || `simple-${productId}`,
    productId,
    name: product?.name || 'Founder’s Toast',
    quantity,
    price: product?.price || 1200,
    stripePriceId: product?.stripePriceId || '',
    images: product?.images?.length ? [product.images[0]] : [],
    category: 'merch',
    currentQuantity: product?.currentQuantity ?? 10,
  };

  const handleAddToCart = () => {
    if (!product) return;
  
    const existingItem = cart.find((item) => item.id === cartItem.id);
  
    const updatedCartItem = {
      ...cartItem,
      quantity: existingItem
        ? Math.min(existingItem.quantity + quantity, product.currentQuantity ?? 10)
        : quantity,
    };
  
    addToCart(updatedCartItem); // ✅ Pass only the final item
    toast.success('🛒 Item added to cart!');
    setButtonText('In Cart');
  };

  const handleRemove = () => {
    removeFromCart(cartItem.id);
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
        className="founders-toast-header-logo"
      />

      <div className="founders-toast-content">
        <div className="founders-toast-image">
          <img src={product.images?.[0]} alt={product.name} />
        </div>

        <div className="founders-toast-details">
          <p className="founders-toast-description">{product.description}</p>

          <div>
            <p className="founders-toast-price">
              ${Number(product.price).toFixed(2)}
            </p>
            <p className="founders-toast-eta">Est Delivery: 5–7 business days</p>
          </div>

          {/* Quantity Selector */}
          {!isInCart && (
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((prev) =>
                    Math.min(prev + 1, product.currentQuantity ?? 10)
                  )
                }
                disabled={quantity >= (product.currentQuantity ?? 10)}
              >
                +
              </button>
            </div>
          )}

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