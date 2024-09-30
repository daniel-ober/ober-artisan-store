import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/firebaseService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart, cart } = useCart();
    const [inCart, setInCart] = useState(null);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                console.log('Fetching product with ID:', id);
                const productData = await fetchProductById(id);
                console.log('Product data:', productData);

                if (productData) {
                    setProduct(productData);
                    setMainImage(productData.images?.[0] || 'https://i.imgur.com/eoKsILV.png');

                    // Convert cart object to array for easier handling
                    const cartArray = Object.values(cart);

                    // Check if the product is in the cart
                    const cartProduct = cartArray.find(item => item.productId === productData._id);
                    setInCart(cartProduct || null);
                } else {
                    setError('Product not found');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Error fetching product');
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, cart]);

    const handleAddToCart = () => {
        if (product) {
            const quantity = inCart ? inCart.quantity + 1 : 1; // Increment quantity if already in cart
            addToCart({ ...product, quantity });
        }
    };

    const handleQuantityChange = (change) => {
        if (!inCart) return;
        const newQuantity = inCart.quantity + change;

        if (newQuantity < 1) return;
        addToCart({ ...product, quantity: newQuantity });
    };

    const handleThumbnailClick = (image) => {
        setMainImage(image);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    const canAdjustQuantity = product?.category !== 'custom shop' && product?.category !== 'one of a kind';

    return (
        <div className="product-detail-container">
            <Link to="/products" className="back-to-shop-link">
                <FaArrowLeft className="back-icon" />
                Back to Shop/Gallery
            </Link>
            <div className="product-image-gallery">
                <img
                    src={mainImage}
                    alt={product?.name}
                    className="product-main-image"
                />
                <div className="product-thumbnail-gallery">
                    {product?.images.map((image, index) => (
                        <button
                            key={index}
                            className="product-thumbnail"
                            onClick={() => handleThumbnailClick(image)}
                        >
                            <img src={image} alt={`Thumbnail ${index + 1}`} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="product-info">
                <h1 className="product-title">{product?.name}</h1>
                <p className="product-description">{product?.description}</p>
                <p className="product-price">${product?.price}</p>
                <button
                    className="add-to-cart-button"
                    onClick={handleAddToCart}
                >
                    {inCart ? 'Update Cart' : 'Add to Cart'}
                </button>
                {canAdjustQuantity && (
                    <div className="quantity-controls">
                        <button
                            className="quantity-button"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={!inCart || inCart.quantity <= 1}
                        >
                            -
                        </button>
                        <span className="quantity-display">{inCart?.quantity || 0}</span>
                        <button
                            className="quantity-button"
                            onClick={() => handleQuantityChange(1)}
                            disabled={!inCart}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
