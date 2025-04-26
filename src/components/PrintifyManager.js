// import React, { useState, useEffect } from 'react';

// const PrintifyManager = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPrintifyProducts = async () => {
//       try {
//         const response = await fetch('https://us-central1-danoberartisandrums.cloudfunctions.net/api/admin/getPrintifyProducts');
//         const data = await response.json();
//         console.log('✅ Fetched Printify products:', data.products);
//         setProducts(Array.isArray(data.products?.data) ? data.products.data : []);
//               } catch (error) {
//         console.error('❌ Error fetching Printify products:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPrintifyProducts();
//   }, []);

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h2>Manage Printify Products</h2>
//       {loading ? (
//         <p>Loading...</p>
//       ) : products.length === 0 ? (
//         <p>No products found.</p>
//       ) : (
//         <ul>
//           {products.map((product) => (
//             <li key={product.id} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
//               <img
//                 src={product.images?.[0]?.src || '/fallback-image.png'}
//                 alt={product.title}
//                 style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 12 }}
//               />
//               <div>
//                 <strong>{product.title}</strong>
//                 <div style={{ fontSize: '0.9rem', color: '#555' }}>
//                   ${product.variants?.[0]?.price / 100 || 'N/A'}
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default PrintifyManager;