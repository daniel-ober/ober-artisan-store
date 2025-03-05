import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { FaArrowLeft } from "react-icons/fa";
import HeritageProductDetail from "./HeritageProductDetail";
import FeuzonProductDetail from "./FeuzonProductDetail";
import SoundlegendProductDetail from "./SoundlegendProductDetail";
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

  // Handle special case product pages (HERITAGE, FEUZON, SOUNDLEGEND)
  if (loading) return <p>Loading product details...</p>;
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <Link to="/products">Return to Products</Link>
      </div>
    );
  }

  if (!product) return <div>Product not found</div>;

  if (productId === "heritage") return <HeritageProductDetail product={product} />;
  if (productId === "feuzon") return <FeuzonProductDetail product={product} />;
  if (productId === "soundlegend") return <SoundlegendProductDetail product={product} />;

  // Standard product page for all other products
  const isSoldOut = product.currentQuantity === 0;
  const isArtisan = product.category === "artisan";
  const isLimited = ["one of a kind", "custom shop"].includes(product.category);
  const maxQuantity = product.currentQuantity || 1;
  const showFullSpecs = product.category === "artisan";
  const speciesList = [product?.woodSpecies, product?.customWoodSpecies].filter(Boolean).join(", ");

  return (
    <div className="product-detail-container">
      <h1 className="product-title">
        {product?.name || "Unnamed Product"}
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
              <div className="product-thumbnail-gallery" ref={thumbnailContainerRef}>
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    className="product-thumbnail"
                    onClick={() => setMainImage(image)}
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
                    <tr><td>Type:</td><td>{product.drumType}</td></tr>
                    <tr><td>Construction:</td><td>{product.constructionType}</td></tr>
                    <tr><td>Wood Species:</td><td>{speciesList}</td></tr>
                    <tr><td>Depth:</td><td>{product.depth}&quot;</td></tr>
                    <tr><td>Diameter:</td><td>{product.width}&quot;</td></tr>
                    <tr><td>Thickness:</td><td>{product.thickness}mm</td></tr>
                  </>
                )}
                <tr>
                  <td>Description:</td>
                  <td>{product.description}</td>
                </tr>
              </tbody>
            </table>

            <div className="product-price-container">
              <p className="product-price">${product?.price}</p>

              {inCart ? (
                <div className="quantity-section">
                  <span className="quantity-label">Quantity:</span>
                  <div className="quantity-selector">
                    {isArtisan ? (
                      <span className="quantity-value">1</span>
                    ) : (
                      <>
                        <button
                          onClick={() => updateQuantity(productId, quantity - 1)}
                          className={`quantity-btn ${quantity <= 1 ? "disabled" : ""}`}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(productId, quantity + 1)}
                          className={`quantity-btn ${
                            quantity >= maxQuantity ? "disabled" : ""
                          }`}
                          disabled={quantity >= maxQuantity}
                          title={
                            quantity >= maxQuantity
                              ? `Maximum quantity available: ${maxQuantity}`
                              : undefined
                          }
                        >
                          +
                        </button>
                      </>
                    )}
                  </div>
                  <button className="prod-detail-view-cart-button" onClick={() => navigate("/cart")}>
                    View in Cart
                  </button>
                  <button className="prod-detail-remove-cart-button" onClick={() => removeFromCart(productId)}>
                    Remove from Cart
                  </button>
                </div>
              ) : isSoldOut ? (
                <>
                  <button className="prod-detail-sold-out-button" disabled>Sold Out</button>
                  {!notifyMe && (
                    <button className="prod-detail-notify-me-button" onClick={() => setNotifyMe(true)}>
                      Notify Me When Available
                    </button>
                  )}
                </>
              ) : (
                <button
onClick={() => addToCart([...cart, { ...product, id: productId, quantity: isArtisan ? 1 : quantity }])}
                  className="prod-detail-add-to-cart-button"
                >
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