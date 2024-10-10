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
    const { addToCart, removeFromCart, cart } = useCart();
    const [inCart, setInCart] = useState(null);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const productData = await fetchProductById(id);

                if (productData) {
                    setProduct(productData);
                    setMainImage(productData.images?.[0] || 'https://i.imgur.com/eoKsILV.png');

                    const cartArray = Object.values(cart);
                    const cartProduct = cartArray.find(item => item.id === id);
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
            addToCart({ ...product, id });
        }
    };

    const handleRemoveFromCart = () => {
        if (inCart) {
            removeFromCart(inCart.id);
            setInCart(null);
        }
    };

    const handleQuantityChange = (change) => {
        if (!inCart) return;
        const newQuantity = inCart.quantity + change;

        if (newQuantity < 1) {
            handleRemoveFromCart();
            return;
        }
        addToCart({ ...product, quantity: newQuantity, id });
    };

    const handleThumbnailClick = (image) => {
        setMainImage(image);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    // Adjust quantity button functionality based on product category
    const isArtisanProduct = product?.category === 'artisan';

    return (
        <div className="product-detail-container">
            {/* <Link to="/products" className="back-to-shop-link">
                <FaArrowLeft className="back-icon" />
                Back to Shop/Gallery
            </Link> */}
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
                <div className="quantity-control">
                    {inCart ? (
                        <>
                            {!isArtisanProduct && (
                                <>
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={!inCart}
                                        className={(!inCart ? 'disabled-button' : '')}
                                    >
                                        -
                                    </button>
                                    <span>{inCart.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={!inCart}
                                        className={(!inCart ? 'disabled-button' : '')}
                                    >
                                        +
                                    </button>
                                </>
                            )}
                            <button onClick={handleRemoveFromCart} className="remove-from-cart-button">
                                Remove from Cart
                            </button>
                        </>
                    ) : (
                        <button onClick={handleAddToCart} className="add-to-cart-button">
                            Add to Cart
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
