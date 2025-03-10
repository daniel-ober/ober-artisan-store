import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ProductCard from "./ProductCard";
import "./Products.css";

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("📥 Fetching active products...");

        // Firestore query: Only fetch products where status is "active"
        const productsRef = collection(db, "products");
        const activeProductsQuery = query(productsRef, where("status", "==", "active"));
        const querySnapshot = await getDocs(activeProductsQuery);

        let productsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort products by displayOrder (defaulting to 0 if not present)
        productsList = productsList.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        setProducts(productsList);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const moveProduct = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;

    const updatedProducts = [...products];
    [updatedProducts[index], updatedProducts[newIndex]] = [updatedProducts[newIndex], updatedProducts[index]];

    updatedProducts.forEach((item, i) => {
      item.displayOrder = i;
    });

    setProducts([...updatedProducts]);

    try {
      const batchUpdates = updatedProducts.map((item) => {
        const productRef = doc(db, "products", item.id);
        return updateDoc(productRef, { displayOrder: item.displayOrder });
      });

      await Promise.all(batchUpdates);
    } catch (error) {
      console.error("❌ Error updating product order:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading Products...</div>;
  }

  return (
    <div className="products-container">
      <h1 className="page-title">Products</h1>

      {isAdmin ? (
        <div className="admin-section">
          <h2>Admin Mode: Use Arrows to Reorder</h2>
          <div className="admin-product-grid">
            {products.map((product, index) => (
              <div key={product.id} className="product-item">
                <div className="product-controls">
                  <button className="move-button left" onClick={() => moveProduct(index, -1)}>&larr;</button>
                  <button className="move-button right" onClick={() => moveProduct(index, 1)}>&rarr;</button>
                </div>
                <ProductCard product={product} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;