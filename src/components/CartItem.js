// // src/components/CartItem.js
// import React from 'react';
// import { useCart } from '../context/CartContext';
// import './Cart.css';

// const CartItem = ({ item }) => {
//   const { removeFromCart, updateQuantity } = useCart();

//   const minQuantity = 1;

//   const handleRemove = () => {
//     removeFromCart(item._id); // Use item._id if that's how it's stored
//   };

//   const handleIncrease = () => {
//     if (item.quantity >= minQuantity) {
//       updateQuantity(item._id, item.quantity + 1);
//     }
//   };

//   const handleDecrease = () => {
//     if (
//       item.quantity > minQuantity &&
//       !['one of a kind', 'custom shop'].includes(item.category)
//     ) {
//       updateQuantity(item._id, item.quantity - 1);
//     }
//   };

//   const quantity = item.quantity || minQuantity;
//   const price = item.price || 0;
//   const subtotal = (price * quantity).toFixed(2);
//   const name = item.name || 'Unnamed Product';
//   const description = item.description || 'No description available.';

//   // ✅ Per-variant preview image logic
//   const fallback = '/fallback-images/fallback_image1.png';
//   const variantId = item.variantId || item.config?.variantId;

//   const variantImage = Array.isArray(item.images)
//     ? item.images.find((img) =>
//         Array.isArray(img.variant_ids)
//           ? img.variant_ids.includes(Number(variantId)) || img.is_default
//           : img.is_default
//       ) || item.images[0]
//     : null;

//   const previewImage =
//     variantImage?.src && typeof variantImage.src === 'string'
//       ? variantImage.src
//       : fallback;

//   return (
//     <div className="cart-item">
//       <img
//         src={previewImage}
//         alt={name}
//         className="cart-item-image"
//         onError={(e) => (e.currentTarget.src = fallback)}
//       />
//       <div className="cart-item-details">
//         <div>
//           <h2 className="cart-item-name">{name}</h2>
//           <p className="cart-item-description">{description}</p>
//           <p className="cart-item-price">${price.toFixed(2)}</p>
//         </div>
//         <div className="cart-item-quantity">
//           <button
//             className={`quantity-btn ${quantity <= minQuantity ? 'disabled' : ''}`}
//             onClick={handleDecrease}
//             disabled={quantity <= minQuantity}
//             data-tooltip="Decrease quantity"
//           >
//             -
//           </button>
//           <span className="quantity-value">{quantity}</span>
//           <button
//             className="quantity-btn"
//             onClick={handleIncrease}
//             data-tooltip="Increase quantity"
//           >
//             +
//           </button>
//           <button
//             className="remove-btn"
//             onClick={handleRemove}
//             data-tooltip="Remove item"
//           >
//             Remove
//           </button>
//         </div>
//         <p className="cart-item-subtotal">Subtotal: ${subtotal}</p>
//       </div>
//     </div>
//   );
// };

// export default CartItem;
