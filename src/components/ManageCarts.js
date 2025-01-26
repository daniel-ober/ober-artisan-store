import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ManageCartsModal from "./ManageCartsModal";
import "./ManageCarts.css";

const ManageCarts = () => {
  const [carts, setCarts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCarts, setFilteredCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null); // Store selected cart details
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // Sorting state
  const [hideGuestCarts, setHideGuestCarts] = useState(false); // Filter guest carts

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const cartCollection = collection(db, "carts");
        const cartSnapshot = await getDocs(cartCollection);

        const cartList = await Promise.all(
          cartSnapshot.docs.map(async (cartDoc) => {
            const cartData = cartDoc.data();
            const itemsMap = cartData.cart || {};

            // Calculate total items and total amount
            const totalItems = Object.values(itemsMap).reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );

            const totalAmount = Object.values(itemsMap).reduce(
              (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
              0
            );

            // Fetch user details if userId is associated with the cart
            let userDetails = { email: "Guest" }; // Default to Guest
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
              shortId: cartDoc.id.slice(-5), // Extract last 5 digits
              ...cartData,
              totalItems,
              totalAmount,
              userDetails,
            };
          })
        );

        setCarts(cartList);
        setFilteredCarts(cartList); // Initialize filtered carts
      } catch (error) {
        console.error("Error fetching carts:", error);
      }
    };

    fetchCarts();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value.trim();
    setSearchQuery(query);

    let results = carts;

    // Apply search filter
    if (query.length >= 3) {
      results = carts.filter((cart) =>
        cart.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply guest filter
    if (hideGuestCarts) {
      results = results.filter((cart) => cart.userDetails.email !== "Guest");
    }

    setFilteredCarts(results);
  };

  const handleRowClick = (cart) => {
    setSelectedCart(cart);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCart(null);
    setIsModalOpen(false);
  };

  const handleHideGuestCartsChange = (event) => {
    const hideGuests = event.target.checked;
    setHideGuestCarts(hideGuests);

    let results = carts;

    // Apply search filter
    if (searchQuery.length >= 3) {
      results = carts.filter((cart) =>
        cart.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply guest filter
    if (hideGuests) {
      results = results.filter((cart) => cart.userDetails.email !== "Guest");
    }

    setFilteredCarts(results);
  };

  // Sorting Logic
  const sortCarts = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedCarts = [...filteredCarts].sort((a, b) => {
      if (key === "user") {
        const emailA = a.userDetails.email.toLowerCase();
        const emailB = b.userDetails.email.toLowerCase();
        if (emailA < emailB) return direction === "asc" ? -1 : 1;
        if (emailA > emailB) return direction === "asc" ? 1 : -1;
        return 0;
      }

      if (key === "lastUpdated") {
        const dateA = a.lastUpdated?.toDate() || new Date(0);
        const dateB = b.lastUpdated?.toDate() || new Date(0);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (key === "totalAmount" || key === "totalItems") {
        return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
      }

      return 0;
    });

    setFilteredCarts(sortedCarts);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "⇅"; // Default sort indicator
  };

  return (
    <div className="manage-carts">
      <h1>Manage Carts</h1>

      {/* Search and Filter Options */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by 3 or more characters of Cart ID"
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <div className="inline-filters">
          <label className="hide-guest-filter">
            <input
              type="checkbox"
              checked={hideGuestCarts}
              onChange={handleHideGuestCartsChange}
            />
            Hide Guest Carts
          </label>
        </div>
      </div>

      {/* Cart Table */}
      <table className="cart-table">
        <thead>
          <tr>
            <th onClick={() => sortCarts("id")}>
              Cart ID {getSortIndicator("id")}
            </th>
            <th onClick={() => sortCarts("user")}>
              User {getSortIndicator("user")}
            </th>
            <th onClick={() => sortCarts("totalItems")}>
              Number of Items {getSortIndicator("totalItems")}
            </th>
            <th onClick={() => sortCarts("totalAmount")}>
              Total Amount ($) {getSortIndicator("totalAmount")}
            </th>
            <th onClick={() => sortCarts("lastUpdated")}>
              Last Updated {getSortIndicator("lastUpdated")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredCarts.length > 0 ? (
            filteredCarts.map((cart) => (
              <tr key={cart.id} onClick={() => handleRowClick(cart)}>
                <td>{cart.shortId}</td>
                <td>{cart.userDetails.email}</td>
                <td>{cart.totalItems}</td>
                <td>${cart.totalAmount.toFixed(2)}</td>
                <td>
                  {cart.lastUpdated?.toDate().toLocaleString() || "N/A"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No carts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {selectedCart && (
        <ManageCartsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          cartDetails={selectedCart}
          userDetails={selectedCart.userDetails}
        />
      )}
    </div>
  );
};

export default ManageCarts;