// import React, { useState } from 'react';

// const PrintifyProductCard = ({ product, isPublished }) => {
//   const [publishing, setPublishing] = useState(false);
//   const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

//   const handlePublish = async () => {
//     setPublishing(true);
//     setToast(null);

//     try {
//       const response = await fetch('/api/admin/importPrintifyProduct', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ printifyProductId: product.id }),
//       });

//       if (response.ok) {
//         setToast({ type: 'success', message: '✅ Product published successfully!' });
//       } else {
//         const data = await response.json();
//         setToast({ type: 'error', message: `❌ Error: ${data.error || 'Failed to publish'}` });
//       }
//     } catch (error) {
//       console.error('Error publishing Printify product:', error);
//       setToast({ type: 'error', message: '❌ Network error while publishing.' });
//     } finally {
//       setPublishing(false);
//     }
//   };

//   const priceRange = product.variants
//     ? `$${Math.min(...product.variants.map(v => v.price)) / 100}–$${Math.max(...product.variants.map(v => v.price)) / 100}`
//     : 'N/A';

//   const availableSizes = product.options?.find(opt => opt.name.toLowerCase().includes('size'))
//     ?.values.map(val => val.title).join(', ') || 'One Size';

//   return (
//     <div className="printify-product-card">
//       <img src={product.images?.[0]?.src || '/fallback-image.png'} alt={product.title} />
//       <h3>{product.title}</h3>
//       <p><strong>Price:</strong> {priceRange}</p>
//       <p><strong>Sizes:</strong> {availableSizes}</p>
//       <p><strong>Variants:</strong> {product.variants?.length || 0}</p>

//       {isPublished ? (
//         <button className="published-button" disabled>Already Published</button>
//       ) : (
//         <button
//           onClick={handlePublish}
//           className="publish-button"
//           disabled={publishing}
//         >
//           {publishing ? 'Publishing...' : 'Publish'}
//         </button>
//       )}

//       {toast && (
//         <div className={`toast ${toast.type}`}>
//           {toast.message}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PrintifyProductCard;