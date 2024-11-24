import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './AdminContainer.css'; // Uncomment if you have CSS

const AdminContainer = ({ children }) => {
  console.log("AdminContainer is rendering"); // Debug statement
  return (
    <div className="admin-container">
      <div className="admin-navbar">
        <nav>
          <ul>
            <li><Link to="/admin/user-management">User Management</Link></li>
            <li><Link to="/admin/order-lookup">Order Lookup</Link></li>
            <li><Link to="/admin/product-catalog">Product Catalog</Link></li>
            <li><Link to="/admin/analytics">Analytics</Link></li>
          </ul>
        </nav>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminContainer;