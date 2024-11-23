import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import { FaArrowLeft } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
    const [inCart, setInCart] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const productData = await fetchProductById(id);
                if (productData) {
                    setProduct(productData);
                    setMainImage(productData.images?.[0] || 'https://i.imgur.com/eoKsILV.png');
                    const cartItem = Object.values(cart).find((item) => item.id === id);
                    setInCart(cartItem || null);
                } else {
                    setError('Product not found.');
                }
            } catch (fetchError) {
                console.error('Error fetching product:', fetchError.message);
                setError('Unable to fetch product details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, cart]);

    const handleAddToCart = () => {
        if (product) {
            addToCart({ ...product, id });
            setInCart({ ...product, quantity: 1 });
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

        updateQuantity(inCart.id, newQuantity);
        setInCart((prev) => ({ ...prev, quantity: newQuantity }));
    };

    const handleThumbnailClick = (image) => setMainImage(image);

    const handleModalOpen = () => setShowModal(true);
    const handleModalClose = () => setShowModal(false);

    if (loading) return <p>Loading product details...</p>;
    if (error) return <p>{error}</p>;

    const isArtisanProduct = product?.category === 'artisan';

    return (
        <div className="product-detail-container">
            <Link to="/products" className="back-to-shop-link">
                <FaArrowLeft className="back-icon" />
                Back to Shop/Gallery
            </Link>
            <div className="product-image-gallery">
                <button
                    className="product-main-image-button"
                    onClick={handleModalOpen}
                    aria-label="Enlarge product image"
                >
                    <img src={mainImage} alt={product?.name || 'Product'} className="product-main-image" />
                </button>
                <div className="product-thumbnail-gallery">
                    {product?.images?.map((image, index) => (
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
                <h1 className="product-title">{product?.name || 'Unnamed Product'}</h1>
                <p className="product-description">{product?.description || 'No description available.'}</p>
                <p className="product-price">${product?.price?.toFixed(2) || 'N/A'}</p>
                <div className="quantity-control">
                    {inCart ? (
                        <>
                            {!isArtisanProduct && (
                                <>
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span>{inCart.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
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

            {showModal && (
                <div
                    className="modal"
                    onClick={(e) => e.target === e.currentTarget && handleModalClose()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Escape' ? handleModalClose() : null)}
                >
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={handleModalClose}
                            aria-label="Close image view"
                        >
                            &times;
                        </button>
                        <img src={mainImage} alt="Enlarged Product" />
                    </div>
                </div>
            )}

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
