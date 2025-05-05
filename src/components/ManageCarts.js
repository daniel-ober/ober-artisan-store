import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import ManageCartsModal from "./ManageCartsModal";
import "./ManageCarts.css";

const ManageCarts = () => {
  const [carts, setCarts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCarts, setFilteredCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showOnlyWithItems, setShowOnlyWithItems] = useState(false);

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const cartCollection = collection(db, "carts");
        const cartSnapshot = await getDocs(cartCollection);

        const cartList = await Promise.all(
          cartSnapshot.docs.map(async (cartDoc) => {
            const cartData = cartDoc.data();
            const itemsMap = cartData.cart || {};

            const totalItems = Object.values(itemsMap).reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );

            const totalAmount = Object.values(itemsMap).reduce(
              (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
              0
            );

            let userDetails = { email: "Guest" };
            if (cartData.userId) {
              try {
                const userRef = doc(db, "users", cartData.userId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  userDetails = { email: userData.email || "Guest" };
                }
              } catch (error) {
                console.error(`Error fetching user for userId ${cartData.userId}:`, error);
              }
            }

            return {
              id: cartDoc.id,
              shortId: cartDoc.id.slice(-5),
              ...cartData,
              totalItems,
              totalAmount,
              userDetails,
            };
          })
        );

        setCarts(cartList);
        applyFiltersAndSort(cartList, searchQuery, showOnlyWithItems, sortConfig);
      } catch (error) {
        console.error("Error fetching carts:", error);
      }
    };

    fetchCarts();
  }, []);

  const applyFiltersAndSort = (cartList, query, onlyWithItems, sortCfg) => {
    let results = [...cartList];

    if (query.length >= 3) {
      results = results.filter((cart) =>
        cart.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (onlyWithItems) {
      results = results.filter((cart) => cart.totalItems > 0);
    }

    if (sortCfg.key) {
      const direction = sortCfg.direction === "asc" ? 1 : -1;
      results.sort((a, b) => {
        if (sortCfg.key === "user") {
          const emailA = a.userDetails.email.toLowerCase();
          const emailB = b.userDetails.email.toLowerCase();
          return emailA < emailB ? -1 * direction : emailA > emailB ? 1 * direction : 0;
        }
        if (sortCfg.key === "lastUpdated") {
          const dateA = a.lastUpdated?.toDate() || new Date(0);
          const dateB = b.lastUpdated?.toDate() || new Date(0);
          return (dateA - dateB) * direction;
        }
        if (["totalItems", "totalAmount"].includes(sortCfg.key)) {
          return (a[sortCfg.key] - b[sortCfg.key]) * direction;
        }
        return 0;
      });
    }

    setFilteredCarts(results);
  };

  const handleSearch = (event) => {
    const query = event.target.value.trim();
    setSearchQuery(query);
    applyFiltersAndSort(carts, query, showOnlyWithItems, sortConfig);
  };

  const handleToggleFilter = () => {
    const next = !showOnlyWithItems;
    setShowOnlyWithItems(next);
    applyFiltersAndSort(carts, searchQuery, next, sortConfig);
  };

  const sortCarts = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    applyFiltersAndSort(filteredCarts, searchQuery, showOnlyWithItems, newSortConfig);
  };

  const deleteCart = async (cartIdToDelete) => {
    try {
      await deleteDoc(doc(db, "carts", cartIdToDelete));
      const updated = carts.filter((cart) => cart.id !== cartIdToDelete);
      setCarts(updated);
      applyFiltersAndSort(updated, searchQuery, showOnlyWithItems, sortConfig);
      closeModal();
    } catch (error) {
      console.error("Error deleting cart:", error);
    }
  };

  const handleRowClick = (cart) => {
    setSelectedCart(cart);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCart(null);
    setIsModalOpen(false);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "⇅";
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
  };

  return (
    <div className="manage-carts">
      <h1>Manage Carts</h1>

      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by 3 or more characters of Cart ID"
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showOnlyWithItems}
            onChange={handleToggleFilter}
          />
          Show only carts with items
        </label>
      </div>

      <table className="cart-table">
        <thead>
          <tr>
            <th onClick={() => sortCarts("id")}>Cart ID {getSortIndicator("id")}</th>
            <th onClick={() => sortCarts("user")}>User {getSortIndicator("user")}</th>
            <th onClick={() => sortCarts("totalItems")}>Number of Items {getSortIndicator("totalItems")}</th>
            <th onClick={() => sortCarts("totalAmount")}>Total Amount ($) {getSortIndicator("totalAmount")}</th>
            <th onClick={() => sortCarts("lastUpdated")}>Last Updated {getSortIndicator("lastUpdated")}</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {filteredCarts.length > 0 ? (
            filteredCarts.map((cart) => (
              <tr key={cart.id}>
                <td onClick={() => handleRowClick(cart)}>
                  {cart.shortId}{" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(cart.id);
                    }}
                    title="Copy full ID"
                    className="copy-id-button"
                  >
                    📋
                  </button>
                </td>
                <td onClick={() => handleRowClick(cart)}>{cart.userDetails.email}</td>
                <td onClick={() => handleRowClick(cart)}>{cart.totalItems}</td>
                <td onClick={() => handleRowClick(cart)}>${cart.totalAmount.toFixed(2)}</td>
                <td onClick={() => handleRowClick(cart)}>
                  {cart.lastUpdated?.toDate().toLocaleString() || "N/A"}
                </td>
                <td>
                  <button
                    onClick={() => deleteCart(cart.id)}
                    className="delete-cart-icon-button"
                    title="Delete this cart"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No carts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedCart && (
        <ManageCartsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          cartDetails={selectedCart}
          userDetails={selectedCart.userDetails}
          onDelete={() => deleteCart(selectedCart.id)}
        />
      )}
    </div>
  );
};

export default ManageCarts;