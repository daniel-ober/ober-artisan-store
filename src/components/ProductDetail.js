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
    }, [id, cart]); // Refetch when id or cart state changes

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

        // Log current state before updating
        console.log("Current inCart state before change:", inCart);

        // Calculate the new quantity
        const newQuantity = inCart.quantity + change;
        console.log("Calculated new quantity:", newQuantity);

        // If quantity is less than 1, remove from cart
        if (newQuantity < 1) {
            console.log("Quantity below 1, removing item from cart");
            handleRemoveFromCart();
            return;
        }

        // Step 1: Update `inCart` state directly
        setInCart((prevInCart) => {
            const updatedInCart = { ...prevInCart, quantity: newQuantity };
            console.log("Updated inCart state:", updatedInCart);  // Log updated inCart state
            return updatedInCart;
        });

        // Log cart state and check if inCart has been updated correctly
        console.log("Cart state after quantity update (before addToCart):", cart);

        // Step 2: Temporarily skip addToCart to focus only on inCart update
        // addToCart({ ...product, quantity: newQuantity, id });

        // Optional: Log the updated inCart state after all functions
        console.log("Final inCart state:", inCart);
    };

    const handleThumbnailClick = (image) => {
        setMainImage(image);
    };

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

            {/* 360 Interactive View Section */}
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
