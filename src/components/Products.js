import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ProductCard from "./ProductCard";
import { Container, Draggable } from "react-smooth-dnd";
import "./Products.css";

// Function to swap array elements
const applyDrag = (arr, dragResult) => {
  const { removedIndex, addedIndex, payload } = dragResult;
  if (removedIndex === null || addedIndex === null) return arr;
  const result = [...arr];
  const [removed] = result.splice(removedIndex, 1);
  result.splice(addedIndex, 0, removed);
  return result;
};

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        console.log("📥 Fetching products...");
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (productsList.length === 0) {
          console.warn("⚠️ No products found.");
          setError("No products available at the moment.");
        }

        const activeProducts = productsList
          .filter((product) => product.status === "active")
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        if (isMounted) {
          setProducts(activeProducts);
        }
      } catch (error) {
        console.error("❌ Error fetching products:", error);
        setError(`Error: ${error.message || "Unable to fetch product details."}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle drag-and-drop
  const onDrop = async (dropResult) => {
    const updatedProducts = applyDrag(products, dropResult);
    setProducts([...updatedProducts]);

    console.log("🔄 Updating product order...");

    try {
      const batchUpdates = updatedProducts.map((product, index) => {
        const productRef = doc(db, "products", product.id);
        return updateDoc(productRef, { displayOrder: index });
      });

      await Promise.all(batchUpdates);
      console.log("✅ Product order updated in Firestore.");
    } catch (error) {
      console.error("❌ Error updating product order:", error);
    }
  };

  if (loading) {
    return <p className="loading-message">Loading products...</p>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="no-products-message">No active products available.</p>;
  }

  return (
    <div className="products-container">
      <h1 className="page-title">Products</h1>

      {isAdmin ? (
        <div className="admin-section">
          <h2>Admin Mode: Drag & Drop to Reorder</h2>
          <Container
            lockAxis="y"
            dragHandleSelector=".drag-handle"
            onDrop={onDrop}
            className="product-grid droppable-container"
          >
            {products.map((product) => (
              <Draggable key={product.id}>
                <div className="draggable-item">
                  <ProductCard product={product} />
                </div>
              </Draggable>
            ))}
          </Container>
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