import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // To get the document ID from the URL
import { fetchProductById } from '../firebaseService'; // Function to fetch product by Firestore document ID
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams(); // This 'id' is the Firestore document ID from the URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await fetchProductById(id); // Use the document ID from the URL
        setProduct(productData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <p>Loading product details...</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-main">
        <img src={product.images} alt={product.name} className="main-image" />
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p className="product-detail-price">Price: ${product.price}</p>
      </div>
    </div>
  );
};

export default ProductDetail;
