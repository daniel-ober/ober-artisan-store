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
    const [inCart, setInCart] = useState(null); // Local state for inCart
    const [mainImage, setMainImage] = useState('');
    const [showModal, setShowModal] = useState(false); // For modal image view

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

    // Handle quantity change for products
    const handleQuantityChange = (change) => {
        if (!inCart) return;

        // Calculate the new quantity
        const newQuantity = inCart.quantity + change;

        // If quantity is less than 1, remove from cart
        if (newQuantity < 1) {
            handleRemoveFromCart();
            return;
        }

        // Update inCart state directly
        setInCart((prevInCart) => {
            const updatedInCart = { ...prevInCart, quantity: newQuantity };
            return updatedInCart;
        });

        // Temporarily skip addToCart to focus only on inCart update
        setTimeout(() => {
            addToCart({ ...product, quantity: newQuantity, id });
        }, 100);
    };

    const handleThumbnailClick = (image) => {
        setMainImage(image);
    };

    const handleModalOpen = () => setShowModal(true);
    const handleModalClose = () => setShowModal(false);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    const isArtisanProduct = product?.category === 'artisan';

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
                    onClick={handleModalOpen} // Open modal when clicked
                    role="button" // Adding a role to ensure it's considered interactive
                    tabIndex="0" // Make it focusable
                    onKeyDown={(e) => e.key === 'Enter' && handleModalOpen()} // Ensure keyboard accessibility
                />
                <div className="product-thumbnail-gallery">
                    {product?.images.map((image, index) => (
                        <button
                            key={index}
                            className="product-thumbnail"
                            onClick={() => handleThumbnailClick(image)}
                            aria-label={`Select image ${index + 1}`}
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
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span>{inCart.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={!inCart}
                                        aria-label="Increase quantity"
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

            {/* Modal for enlarged image */}
            {showModal && (
                <div className="modal show" onClick={handleModalClose} role="dialog" aria-labelledby="modalTitle">
                    <button className="modal-close" onClick={handleModalClose} aria-label="Close image view">&times;</button>
                    <img src={mainImage} alt="Enlarged Product" />
                </div>
            )}

            {/* 360° Interactive View Section */}
            {product?.interactive360Url && (
                <div className="interactive-360-container">
                    <h2>360° View</h2>
                    <iframe
                        src={product.interactive360Url}
                        width="100%"
                        height="500px"
                        allowFullScreen
                        title={`${product?.name} 360 View`}
                        className="interactive-360-iframe"
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
