import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ProductCard from "./ProductCard";
import "./Products.css";

const Products = ({ isMerchPage = false }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const collectionName = isMerchPage ? "merchProducts" : "products";
        const ref = collection(db, collectionName);
        const q = query(ref, where("status", "==", "active"));
        const snapshot = await getDocs(q);

        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          collection: collectionName,
        }));

        items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setProducts(items);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isMerchPage]);

  const moveProduct = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;

    const updatedProducts = [...products];
    [updatedProducts[index], updatedProducts[newIndex]] = [updatedProducts[newIndex], updatedProducts[index]];
    updatedProducts.forEach((item, i) => (item.displayOrder = i));
    setProducts([...updatedProducts]);

    try {
      await Promise.all(
        updatedProducts.map((item) =>
          updateDoc(doc(db, item.collection || (isMerchPage ? "merchProducts" : "products"), item.id), {
            displayOrder: item.displayOrder,
          })
        )
      );
    } catch (error) {
      console.error("❌ Error updating product order:", error);
    }
  };

  if (loading) return <div className="loading">Loading Products...</div>;

  return (
    <div className="products-container">
      <h1 className="products-page-title">{isMerchPage ? "Merch" : "Products"}</h1>

      <div className={isAdmin ? "admin-product-grid" : "product-grid"}>
        {products.map((product, index) => (
          <div key={product.id} className="product-item">
            {isAdmin && (
              <div className="product-controls top">
                <button className="move-button left" onClick={() => moveProduct(index, -1)}>←</button>
                <button className="move-button right" onClick={() => moveProduct(index, 1)}>→</button>
              </div>
            )}
            <ProductCard product={product} isAdmin={isAdmin} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;