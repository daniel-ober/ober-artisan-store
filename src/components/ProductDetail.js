import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { FaArrowLeft } from "react-icons/fa";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, updateQuantity, removeFromCart, cart } = useCart();
  const [inCart, setInCart] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notifyMe, setNotifyMe] = useState(false);
  const thumbnailContainerRef = useRef(null);

  // Fetch product details
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(productId);
        if (productData) {
          setProduct(productData);
          setMainImage(
            productData.images?.[0] || "/fallback-images/images-coming-soon-regular.png"
          );
        } else {
          setError("Product not found.");
        }
      } catch (fetchError) {
        console.error("Error fetching product:", fetchError.message);
        setError("Unable to fetch product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  // Sync cart state
  useEffect(() => {
    if (product) {
      const cartItem = cart ? cart[productId] : null;
      if (cartItem) {
        setInCart(cartItem);
        setQuantity(Math.min(cartItem.quantity, product.currentQuantity));
      } else {
        setInCart(null);
        setQuantity(1);
      }
    }
  }, [cart, product, productId]);

  const handleAddToCart = () => {
    if (product) {
      const availableQuantity = product.currentQuantity || 0;

      if (quantity > availableQuantity) {
        alert(`Only ${availableQuantity} of this product is available.`);
        setQuantity(availableQuantity); // Adjust to the available quantity
        return;
      }

      addToCart({ ...product, id: productId, quantity });
      setInCart({ ...product, quantity });
    }
  };

  const handleRemoveFromCart = () => {
    removeFromCart(productId);
    setInCart(null);
    setQuantity(1); // Reset quantity
  };

  const handleQuantityChange = (change) => {
    const availableQuantity = product.currentQuantity || 0;
    const newQuantity = quantity + change;

    if (newQuantity > availableQuantity) {
      alert(`Only ${availableQuantity} of this product is available.`);
      return;
    }

    if (newQuantity < 1) {
      handleRemoveFromCart();
      return;
    }

    setQuantity(newQuantity);
    if (inCart) {
      updateQuantity(productId, newQuantity); // Sync with cart if already in cart
    }
  };

  const handleThumbnailClick = (image) => {
    setMainImage(image);
  };

  const handleNotifyMe = () => {
    alert("You will be notified once this product is available again!");
    setNotifyMe(true);
  };

  const handleViewCart = () => {
    navigate("/cart");
  };

  const speciesList = [product?.woodSpecies, product?.customWoodSpecies]
    .filter(Boolean)
    .join(", ");

  if (loading) return <p>Loading product details...</p>;
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <Link to="/products">Return to Products</Link>
      </div>
    );
  }

  const isSoldOut = product.currentQuantity === 0;
  const isArtisan = product.category === 'artisan';
  const showFullSpecs = product.category === 'artisan';

  return (
    <div className="product-detail-container">
      {/* <div className="product-header">
        <Link to="/products" className="back-to-shop-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div> */}

      <h1 className="product-title">
        {product?.name || "Unnamed Product"}, {product.depth}&quot; x{" "}
        {product.width}&quot; {product.drumType} ({product.finish})
      </h1>

      <div className="product-content">
        <div className="product-gallery-info">
          <div className="product-image-gallery">
            <img
              src={mainImage}
              alt={product?.name || "Product"}
              className="product-main-image"
            />
            <div className="thumbnail-scroll-container">
              <div
                className="product-thumbnail-gallery"
                ref={thumbnailContainerRef}
              >
                {product?.images?.map((image, index) => (
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
          </div>

          <div className="product-info">
            <h2>Product Specifications</h2>
            <table className="artisan-specs-table">
              <tbody>
                {showFullSpecs && (
                  <>
                    <tr>
                      <td>Type:</td>
                      <td>{product.drumType}</td>
                    </tr>
                    <tr>
                      <td>Construction:</td>
                      <td>{product.constructionType}</td>
                    </tr>
                    <tr>
                      <td>Wood Species:</td>
                      <td>{speciesList}</td>
                    </tr>
                    <tr>
                      <td>Depth:</td>
                      <td>{product.depth}&quot;</td>
                    </tr>
                    <tr>
                      <td>Diameter:</td>
                      <td>{product.width}&quot;</td>
                    </tr>
                    <tr>
                      <td>Thickness:</td>
                      <td>{product.thickness}mm</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td>Description:</td>
                  <td>{product.description}</td>
                </tr>
              </tbody>
            </table>

            <div className="product-price-container">
              <p className="product-price">${product?.price?.toFixed(2)}</p>

              {inCart ? (
                <div className="quantity-section">
                  <span className="quantity-label">Quantity:</span>
                  <div className="quantity-selector">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className={`quantity-btn ${quantity <= 1 ? "disabled" : ""}`}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className={`quantity-btn ${
                        quantity >= product.currentQuantity ? "disabled" : ""
                      }`}
                      disabled={quantity >= product.currentQuantity}
                      title={
                        quantity >= product.currentQuantity
                          ? `Maximum quantity available: ${product.currentQuantity}`
                          : undefined
                      }
                    >
                      +
                    </button>
                  </div>
                  <button className="view-cart-button" onClick={handleViewCart}>
                    View in Cart
                  </button>
                  <button
                    className="remove-cart-button"
                    onClick={handleRemoveFromCart}
                  >
                    Remove from Cart
                  </button>
                </div>
              ) : isSoldOut ? (
                <>
                  <button className="sold-out-button" disabled>
                    Sold Out
                  </button>
                  {!notifyMe && (
                    <button className="notify-me-button" onClick={handleNotifyMe}>
                      Notify Me When Available
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleAddToCart} className="add-to-cart-button">
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;