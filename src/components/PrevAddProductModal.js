// import React, { useState } from 'react';
// import { db } from '../firebaseConfig';
// import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
// import { uploadImage } from '../services/firebaseService';
// import { createStripeProduct, createStripePrice } from '../services/stripeService';
// import './AddProductModal.css';
// import ArtisanSpecsForm from './ArtisanSpecsForm';
// import LoadingSpinner from './LoadingSpinner';
// import SuccessModal from './SuccessModal';

// const AddProductModal = ({ onClose }) => {
//   const [step, setStep] = useState(1);
//   const [newProduct, setNewProduct] = useState({
//     category: '',
//     artisanLine: '',
//     newArtisanLine: '',
//     name: '',
//     description: '',
//     deliveryTime: '',
//     images: [],
//     interactive360Url: '',
//     status: 'inactive',
//     isPreOrder: false,
//     maxQuantity: 1, // ✅ Default at least 1
//     currentQuantity: 1,
//     isAvailable: false,
//     availabilityMessage: '',
//     price: 0,
//     pricingOptions: [],
//   });

//   const [imageFiles, setImageFiles] = useState([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [successProductId, setSuccessProductId] = useState(null);
//   const [error, setError] = useState('');
//   let isSubmitting = false;

//   const categories = ['artisan', 'merch', 'accessories'];
//   const artisanLines = ['HERìTAGE', 'FEUZØN', 'SOUNDLEGEND', 'LIMITED BATCH', 'ONE', '+ADD ARTISAN LINE'];
  
//   // ✅ Add a new price option
//   const addPriceOption = () => {
//     setNewProduct((prev) => ({
//       ...prev,
//       pricingOptions: [
//         ...prev.pricingOptions,
//         { size: '', depth: '', reRing: false, price: 0 },
//       ],
//     }));
//   };

//   // ✅ Update an existing price option
//   const updatePriceOption = (index, field, value) => {
//     setNewProduct((prev) => {
//       const updatedOptions = [...prev.pricingOptions];
//       updatedOptions[index] = { ...updatedOptions[index], [field]: value };
//       return { ...prev, pricingOptions: updatedOptions };
//     });
//   };

//   // ✅ Remove a price option
//   const removePriceOption = (index) => {
//     setNewProduct((prev) => ({
//       ...prev,
//       pricingOptions: prev.pricingOptions.filter((_, i) => i !== index),
//     }));
//   }; // ✅ Ensure this is properly closed!

//   // ✅ Fix Space Bar Issue (Remove `trim()` for Inputs)
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewProduct((prev) => ({
//       ...prev,
//       [name]: ['price', 'maxQuantity', 'currentQuantity'].includes(name)
//         ? parseFloat(value) || 0
//         : value, // ✅ Allow Spaces
//     }));
//   };

//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     setImageFiles(files);
//   };

//   const handleNextStep = () => setStep((prev) => prev + 1);
//   const handlePreviousStep = () => setStep((prev) => prev - 1);
//   const generateSlug = (text) => text.toLowerCase().replace(/\s+/g, '-');

//   const handleArtisanSubmit = async (artisanData) => {
//     if (isSubmitting) {
//       console.warn('[handleArtisanSubmit] Duplicate submission prevented.');
//       return;
//     }
  
//     isSubmitting = true;
//     setIsUploading(true);
//     setError('');
//     setSuccessProductId(null);
  
//     try {
//       console.log(`[handleArtisanSubmit] Called at ${new Date().toISOString()}`);
  
//       // ✅ Validation for required fields
//       if (!newProduct.name.trim()) throw new Error('❌ Product name is required.');
//       if (!newProduct.description.trim()) throw new Error('❌ Product description is required.');
//       if (!newProduct.deliveryTime.trim()) throw new Error('❌ Delivery time is required.');
//       if (newProduct.maxQuantity <= 0) throw new Error('❌ Max quantity must be greater than 0.');
//       if (newProduct.currentQuantity < 0 || newProduct.currentQuantity > newProduct.maxQuantity) {
//         throw new Error('❌ Current quantity must be between 0 and max quantity.');
//       }
  
//       const isNewArtisan = newProduct.category === '+ ADD NEW ARTISAN LINE';
//       const artisanLineSlug = isNewArtisan ? generateSlug(newProduct.newArtisanLine) : generateSlug(newProduct.artisanLine);
  
//       // ✅ Step 1: Upload Images & Get URLs
//       console.log("[handleArtisanSubmit] Uploading images...");
  
//       const uploadedImages = await Promise.all(
//         imageFiles.map(async (file) => {
//           try {
//             const imageUrl = await uploadImage(file, 'products');
//             if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
//               throw new Error(`Invalid URL returned from uploadImage: ${imageUrl}`);
//             }
//             return imageUrl;
//           } catch (uploadError) {
//             console.error("❌ Image upload failed:", uploadError);
//             return null;
//           }
//         })
//       );
  
//       console.log("[handleArtisanSubmit] Raw Uploaded Images:", uploadedImages);
  
//       // ✅ Step 2: Filter out any failed uploads (null values)
//       const validatedImages = uploadedImages.filter(url => typeof url === 'string' && url.startsWith('http'));
  
//       console.log("[handleArtisanSubmit] Validated Images:", validatedImages);
  
//       if (validatedImages.length === 0) {
//         throw new Error("❌ Images must be an array of valid URLs.");
//       }
  
//       // ✅ Step 3: Extract highest price for artisan products
//       let productPrice = newProduct.price;
//       if (newProduct.category === "artisan" && newProduct.pricingOptions.length > 0) {
//         productPrice = Math.max(...newProduct.pricingOptions.map((option) => option.price), 0);
//       }
  
//       if (productPrice <= 0) {
//         throw new Error('❌ At least one price must be greater than 0.');
//       }
  
//       // ✅ Step 4: Create Stripe Product
//       const stripeProduct = await createStripeProduct(
//         newProduct.name,
//         newProduct.description,
//         validatedImages, // ✅ Use validatedImages, not uploadedImages
//         { SKU: artisanLineSlug }
//       );
  
//       if (!stripeProduct || !stripeProduct.id) {
//         throw new Error('❌ Failed to create Stripe product.');
//       }
  
//       console.log('[handleArtisanSubmit] Stripe Product Created:', stripeProduct.id);
  
//       // ✅ Step 5: Create Stripe Prices for each pricing option
//       const updatedPricingOptions = await Promise.all(
//         newProduct.pricingOptions.map(async (option) => {
//           const stripePrice = await createStripePrice(stripeProduct.id, option.price * 100);
//           return { ...option, stripePriceId: stripePrice.id };
//         })
//       );
  
//       // ✅ Step 6: Save Final Product Data to Firestore
//       const finalProductData = {
//         ...newProduct,
//         ...artisanData,
//         artisanLine: isNewArtisan ? newProduct.newArtisanLine : newProduct.artisanLine,
//         sku: artisanLineSlug,
//         images: validatedImages, // ✅ Save validated images
//         createdAt: serverTimestamp(),
//         currentQuantity: newProduct.maxQuantity,
//         isOutOfStock: newProduct.maxQuantity === 0,
//         stripeProductId: stripeProduct.id,
//         pricingOptions: updatedPricingOptions, // ✅ Save updated pricing options
//       };
  
//       console.log('[handleArtisanSubmit] Final Product Data for Firestore:', finalProductData);
  
//       const docRef = await addDoc(collection(db, 'products'), finalProductData);
//       console.log('[handleArtisanSubmit] Firestore Document Created:', docRef.id);
  
//       setSuccessProductId(artisanLineSlug);
  
//       // ✅ Step 7: Reset Form
//       setNewProduct({
//         category: '',
//         artisanLine: '',
//         newArtisanLine: '',
//         name: '',
//         price: 0,
//         description: '',
//         deliveryTime: '',
//         images: [],
//         interactive360Url: '',
//         status: 'inactive',
//         isPreOrder: false,
//         maxQuantity: 1,
//         currentQuantity: 1,
//         isAvailable: false,
//         availabilityMessage: '',
//         pricingOptions: [],
//       });
  
//       setImageFiles([]);
//       setStep(1);
//     } catch (err) {
//       console.error('[handleArtisanSubmit] Error:', err.message);
//       setError(err.message || '❌ Failed to add product. Please check all required fields.');
//     } finally {
//       isSubmitting = false;
//       setIsUploading(false);
//     }
//   };



//   return (
//     <div className="add-product-modal">
//       <div className="modal-content">
//         {successProductId ? (
//           <SuccessModal productId={successProductId} />
//         ) : (
//           <>
//             <h2>Add New Product</h2>
  
//             {error && <div className="error-message">{error}</div>}
  
//             {isUploading ? (
//               <LoadingSpinner />
//             ) : (
//               <form>
//                 {step === 1 && (
//                   <>
//                     <div className="form-group">
//                       <label htmlFor="category">Category*</label>
//                       <select
//                         id="category"
//                         name="category"
//                         value={newProduct.category}
//                         onChange={handleInputChange}
//                         required
//                       >
//                         <option value="">Select Category</option>
//                         {categories.map((cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     {newProduct.category === "artisan" && (
//                       <div className="form-group">
//                         <label htmlFor="artisanLine">Artisan Line*</label>
//                         <select
//                           id="artisanLine"
//                           name="artisanLine"
//                           value={newProduct.artisanLine}
//                           onChange={handleInputChange}
//                           required
//                         >
//                           <option value="">Select Artisan Line</option>
//                           {artisanLines.map((line) => (
//                             <option key={line} value={line}>
//                               {line}
//                             </option>
//                           ))}
//                           <option value="+ ADD NEW ARTISAN LINE">+ ADD NEW ARTISAN LINE</option>
//                         </select>
//                       </div>
//                     )}

//                     {newProduct.artisanLine === "+ ADD NEW ARTISAN LINE" && (
//                       <div className="form-group">
//                         <label htmlFor="newArtisanLine">New Artisan Line Name*</label>
//                         <input
//                           id="newArtisanLine"
//                           type="text"
//                           name="newArtisanLine"
//                           value={newProduct.newArtisanLine || ""}
//                           onChange={handleInputChange}
//                           required
//                         />
//                       </div>
//                     )}

//                     <div className="form-group">
//                       <label htmlFor="name">Product Name*</label>
//                       <input
//                         id="name"
//                         type="text"
//                         name="name"
//                         value={newProduct.name}
//                         onChange={handleInputChange}
//                         required
//                       />
//                     </div>

//                     {newProduct.category === "artisan" ? (
//                       <div className="form-group">
//                         <label htmlFor="pricingOptions">Pricing Options (Artisan Only)</label>
//                         <div id="pricingOptions">
//                           {newProduct.pricingOptions.map((option, index) => (
//                             <div key={index} className="price-option">
//                               <label htmlFor={`size-${index}`}>Size*</label>
//                               <select
//                                 id={`size-${index}`}
//                                 name={`size-${index}`}
//                                 value={option.size}
//                                 onChange={(e) => updatePriceOption(index, "size", e.target.value)}
//                                 required
//                               >
//                                 <option value="">Select Size</option>
//                                 <option value="12-inch">12-inch</option>
//                                 <option value="13-inch">13-inch</option>
//                                 <option value="14-inch">14-inch</option>
//                               </select>

//                               <label htmlFor={`depth-${index}`}>Depth*</label>
//                               <select
//                                 id={`depth-${index}`}
//                                 name={`depth-${index}`}
//                                 value={option.depth}
//                                 onChange={(e) => updatePriceOption(index, "depth", e.target.value)}
//                                 required
//                               >
//                                 <option value="">Select Depth</option>
//                                 <option value="5-inch">5-inch</option>
//                                 <option value="5.5-inch">5.5-inch (14” only)</option>
//                                 <option value="6-inch">6-inch</option>
//                                 <option value="6.5-inch">6.5-inch (14” only)</option>
//                                 <option value="7-inch">7-inch</option>
//                               </select>

//                               <div className="checkbox-group">
//                                 <input
//                                   id={`reRing-${index}`}
//                                   name={`reRing-${index}`}
//                                   type="checkbox"
//                                   checked={option.reRing}
//                                   onChange={(e) =>
//                                     updatePriceOption(index, "reRing", e.target.checked)
//                                   }
//                                 />
//                                 <label htmlFor={`reRing-${index}`}>
//                                   10 Lug, 10 Stave, 10mm Shell (14” only)
//                                 </label>
//                               </div>

//                               <label htmlFor={`price-${index}`}>Price (USD)*</label>
//                               <input
//                                 id={`price-${index}`}
//                                 name={`price-${index}`}
//                                 type="number"
//                                 placeholder="Price (USD)"
//                                 value={option.price}
//                                 onChange={(e) => updatePriceOption(index, "price", e.target.value)}
//                                 required
//                               />

//                               <button type="button" onClick={() => removePriceOption(index)}>
//                                 Remove
//                               </button>
//                             </div>
//                           ))}
//                         </div>

//                         <button type="button" onClick={addPriceOption}>
//                           + Add Price Option
//                         </button>
//                       </div>
//                     ) : (
//                       <div className="form-group">
//                         <label htmlFor="price">Price (USD)*</label>
//                         <input
//                           id="price"
//                           type="number"
//                           name="price"
//                           value={newProduct.price}
//                           onChange={handleInputChange}
//                           required
//                         />
//                       </div>
//                     )}

//                     <div className="form-group">
//                       <label htmlFor="deliveryTime">Delivery Time*</label>
//                       <input
//                         id="deliveryTime"
//                         type="text"
//                         name="deliveryTime"
//                         value={newProduct.deliveryTime}
//                         onChange={handleInputChange}
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label htmlFor="description">Description*</label>
//                       <textarea
//                         id="description"
//                         name="description"
//                         value={newProduct.description}
//                         onChange={handleInputChange}
//                         required
//                       ></textarea>
//                     </div>

//                     <div className="form-group">
//                       <label htmlFor="file-upload">Images*</label>
//                       <input
//                         id="file-upload"
//                         type="file"
//                         accept="image/*"
//                         multiple
//                         onChange={handleFileChange}
//                       />
//                     </div>

//                     <div className="button-group">
//                       {newProduct.category === "artisan" ? (
//                         <button type="button" onClick={handleNextStep}>
//                           Next
//                         </button>
//                       ) : (
//                         <button type="button" onClick={() => handleArtisanSubmit({})}>
//                           Submit
//                         </button>
//                       )}
//                       <button type="button" onClick={onClose}>
//                         Close
//                       </button>
//                     </div>
//                   </>
//                 )}

//                 {step === 2 && newProduct.category === "artisan" && (
//                   <ArtisanSpecsForm onBack={handlePreviousStep} onSubmit={handleArtisanSubmit} />
//                 )}
//               </form>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AddProductModal;


// .add-product-modal {
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background: rgba(0, 0, 0, 0.65);  /* Darker overlay for emphasis */
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   z-index: 1050;
//   animation: fadeIn 0.3s ease-in-out;
// }

// .modal-content {
//   background: #ffffff;
//   border-radius: 12px;
//   max-width: 750px;
//   width: 100%;
//   padding: 35px;
//   box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4); /* Deeper shadow for a floating effect */
//   position: relative;
//   animation: slideUp 0.4s ease-in-out;
//   border: 1px solid #e1e1e1;
// }

// .modal-content h2 {
//   font-size: 2rem;
//   font-weight: 700;
//   margin-bottom: 25px;
//   text-align: center;
//   color: #222;
// }

// .form-group {
//   margin-bottom: 22px;
// }

// .form-group label {
//   font-size: 1rem;
//   font-weight: 600;
//   color: #444;
//   margin-bottom: 10px;
//   display: block;
// }

// .form-group input,
// .form-group select,
// .form-group textarea {
//   width: 100%;
//   border: 1px solid #d1d1d1;
//   border-radius: 6px;
//   padding: 14px;
//   font-size: 1rem;
//   color: #333;
//   background: #f7f7f7;
//   transition: all 0.3s ease;
// }

// .form-group input:focus,
// .form-group select:focus,
// .form-group textarea:focus {
//   border-color: #007bff;
//   box-shadow: 0 0 12px rgba(0, 123, 255, 0.4);
//   background: #fff;
// }

// .image-upload {
//   margin: 25px 0;
//   padding: 15px;
//   border: 2px dashed #bbb;
//   border-radius: 8px;
//   text-align: center;
//   background: #f4f4f4;
//   cursor: pointer;
//   transition: border-color 0.3s ease, background-color 0.3s ease;
// }

// .image-upload:hover {
//   border-color: #007bff;
//   background-color: #f0f8ff;
// }

// .image-upload p {
//   font-size: 1rem;
//   color: #666;
// }

// button {
//   padding: 14px 20px;
//   border: none;
//   border-radius: 6px;
//   font-size: 1rem;
//   cursor: pointer;
//   font-weight: 600;
//   transition: background-color 0.3s ease, box-shadow 0.3s ease;
// }

// button[type="submit"] {
//   background: linear-gradient(135deg, #007bff, #0056b3);
//   color: #fff;
//   box-shadow: 0 6px 12px rgba(0, 123, 255, 0.4);
// }

// button[type="submit"]:hover {
//   background: linear-gradient(135deg, #0056b3, #004494);
//   box-shadow: 0 8px 20px rgba(0, 123, 255, 0.5);
// }

// button[type="button"] {
//   background: #f1f1f1;
//   color: #333;
// }

// button[type="button"]:hover {
//   background: #e2e2e2;
// }

// .button-group {
//   display: flex;
//   justify-content: space-between;
//   margin-top: 40px;
// }

// .addproduct-close-btn {
//   position: absolute;
//   top: 20px;
//   right: 20px;
//   background: none;
//   border: none;
//   font-size: 2rem;
//   color: #888;
//   cursor: pointer;
//   transition: color 0.3s ease;
// }

// .addproduct-close-btn:hover {
//   color: #d9534f;
// }

// /* Error & Success Messages */
// .error-message {
//   background: #f8d7da;
//   color: #721c24;
//   padding: 14px;
//   border-radius: 8px;
//   margin-bottom: 25px;
//   text-align: center;
//   border: 1px solid #f5c6cb;
//   font-weight: 500;
// }

// .success-message {
//   background: #d4edda;
//   color: #155724;
//   padding: 14px;
//   border-radius: 8px;
//   margin-bottom: 25px;
//   text-align: center;
//   border: 1px solid #c3e6cb;
//   font-weight: 500;
// }

// /* Animations */
// @keyframes fadeIn {
//   from {
//     opacity: 0;
//   }
//   to {
//     opacity: 1;
//   }
// }

// @keyframes slideUp {
//   from {
//     transform: translateY(50px);
//   }
//   to {
//     transform: translateY(0);
//   }
// }
