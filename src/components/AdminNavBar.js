// // AdminNavBar.js
// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import './AdminNavBar.css'; // Style for AdminNavBar

// const AdminNavBar = () => {
//   const location = useLocation();

//   return (
//     <nav className="admin-navbar">
//       <Link
//         to="/admin/user-management"
//         className={`admin-nav-link ${location.pathname === '/admin/user-management' ? 'active' : ''}`}
//       >
//         User Management
//       </Link>
//       <Link
//         to="/admin/order-lookup"
//         className={`admin-nav-link ${location.pathname === '/admin/order-lookup' ? 'active' : ''}`}
//       >
//         Order Lookup
//       </Link>
//       <Link
//         to="/admin/product-catalog"
//         className={`admin-nav-link ${location.pathname === '/admin/product-catalog' ? 'active' : ''}`}
//       >
//         Product Catalog
//       </Link>
//       <Link
//         to="/admin/analytics"
//         className={`admin-nav-link ${location.pathname === '/admin/analytics' ? 'active' : ''}`}
//       >
//         Analytics
//       </Link>
//     </nav>
//   );
// };

// export default AdminNavBar;
