// import React, { useState, useEffect } from 'react';
// import { db } from '../firebaseConfig'; // Import Firebase
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import './PreOrder.css';

// const PreOrder = () => {
//   const [preOrderProducts, setPreOrderProducts] = useState([]);
//   const [showCustomShopForm, setShowCustomShopForm] = useState(false);

//   // Fetch products available for Pre-Order from Firestore
//   useEffect(() => {
//     const fetchPreOrderProducts = async () => {
//       const q = query(collection(db, 'products'), where('isPreOrder', '==', true)); // Filter Pre-Order products
//       const querySnapshot = await getDocs(q);
//       const products = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setPreOrderProducts(products);
//     };
//     fetchPreOrderProducts();
//   }, []);

//   const handleCustomShopToggle = () => {
//     setShowCustomShopForm((prev) => !prev);
//   };

//   const handlePreOrderClick = (product) => {
//     // Redirect to Stripe checkout (e.g., using a URL)
//     window.location.href = product.stripeCheckoutUrl;
//   };

//   return (
//     <div className="pre-order-container">
//       <h1>Pre-Order Now</h1>
//       <p className="subtitle">Explore our exclusive pre-order options and reserve your piece today.</p>
//       <div className="product-list">
//         {preOrderProducts.map((product) => (
//           <div key={product.id} className="product-card">
//             <img src={product.imageUrl} alt={product.name} className="product-image" />
//             <div className="product-info">
//               <h3>{product.name}</h3>
//               <p>{product.description}</p>
//               <p className="price">${product.price}</p>
//               <button
//                 className="pre-order-btn"
//                 onClick={() => handlePreOrderClick(product)}
//               >
//                 Pre-Order Now
//               </button>
//             </div>
//           </div>
//         ))}

//         {/* Oaked Ember Snare Drum */}
//         <div className="product-card">
//           <img
//             src="https://your-image-url.com/oaked-ember.jpg" // Replace with actual image URL
//             alt="Oaked Ember Snare Drum"
//             className="product-image"
//           />
//           <div className="product-info">
//             <h3>Oaked Ember Snare Drum</h3>
//             <p>
//               The Oaked Ember snare drum blends roasted maple staves with an oaken finish,
//               delivering unmatched resonance and warmth.
//             </p>
//             <ul className="faq-list">
//               <li><strong>Material:</strong> Roasted Maple with Oak Ply</li>
//               <li><strong>Size:</strong> 14" x 6.5"</li>
//               <li><strong>Finish:</strong> Handcrafted Burnt Amber</li>
//               <li><strong>Ships:</strong> Within 4-6 weeks of pre-order</li>
//             </ul>
//             <p className="price">$899.00</p>
//             <button
//               className="pre-order-btn"
//               onClick={() =>
//                 window.location.href = 'https://stripe-checkout-url.com/oaked-ember' // Replace with actual Stripe URL
//               }
//             >
//               Pre-Order Now
//             </button>
//           </div>
//         </div>

//         {/* Custom Shop Order Option */}
//         <div className="product-card">
//           <img
//             src="https://your-image-url.com/custom-shop.jpg" // Replace with actual image URL
//             alt="Custom Shop Orders"
//             className="product-image"
//           />
//           <div className="product-info">
//             <h3>Custom Shop Orders</h3>
//             <p>
//               Design your dream drum with our Custom Shop. Choose materials, size,
//               color, and more with AI-driven assistance.
//             </p>
//             <button
//               className="pre-order-btn"
//               onClick={handleCustomShopToggle}
//             >
//               Start Custom Order
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Custom Shop Form */}
//       {showCustomShopForm && (
//         <div className="custom-shop-form">
//           <h2>Custom Shop Order Form</h2>
//           <p>Let us help you design your perfect drum. Fill out the form below:</p>
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               // Submit form logic (e.g., send to admin pipeline)
//               alert('Custom shop order submitted!');
//               setShowCustomShopForm(false);
//             }}
//           >
//             <div className="form-group">
//               <label htmlFor="material">Preferred Material</label>
//               <select id="material" required>
//                 <option value="">Select Material</option>
//                 <option value="maple">Maple</option>
//                 <option value="birch">Birch</option>
//                 <option value="oak">Oak</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="size">Drum Size</label>
//               <input type="text" id="size" placeholder="e.g., 14 x 6.5" required />
//             </div>
//             <div className="form-group">
//               <label htmlFor="finish">Finish</label>
//               <input type="text" id="finish" placeholder="e.g., Burnt Amber" required />
//             </div>
//             <div className="form-group">
//               <label htmlFor="notes">Additional Notes</label>
//               <textarea id="notes" placeholder="Share your preferences..." rows="4"></textarea>
//             </div>
//             <button type="submit" className="pre-order-btn">Submit</button>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PreOrder;
