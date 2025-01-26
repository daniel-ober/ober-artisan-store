import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaDrum,
  FaShoppingCart,
  FaBox,
  FaDollarSign,
  FaEnvelope,
  FaCog,
  FaImages,
} from 'react-icons/fa';
import ManageProducts from './ManageProducts';
import ManageUsers from './ManageUsers';
import ManageOrders from './ManageOrders';
import SalesPipeline from './SalesPipeline';
import ManageInquiries from './ManageInquiries';
import ManageGallery from './ManageGallery';
import SiteSettings from './SiteSettings';
import ManageCarts from './ManageCarts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState(null);

  // Notification counts
  const [notifications, setNotifications] = useState({
    manageProducts: 0,
    manageCarts: 0,
    manageOrders: 0,
    manageInquiries: 0, // For "New" inquiries only
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [
          productsOutOfStock,
          unfulfilledOrders,
          newInquiriesCount,
        ] = await Promise.all([
          getOutOfStockProductsCount(),
          getUnfulfilledOrdersCount(),
          getNewInquiriesCount(),
        ]);

        setNotifications((prev) => ({
          ...prev,
          manageProducts: productsOutOfStock,
          manageOrders: unfulfilledOrders,
          manageInquiries: newInquiriesCount, // Badge count for Manage Inquiries
        }));
      } catch (error) {
        console.error('Error fetching notifications:', error.message);
      }
    };

    fetchNotifications();
  }, []);

  // Fetch out-of-stock products count
  const getOutOfStockProductsCount = async () => {
    try {
      const response = await fetch('http://localhost:4949/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      return data.products.filter((product) => product.currentQuantity === 0)
        .length;
    } catch (error) {
      console.error('Error fetching products:', error.message);
      return 0;
    }
  };

  // Fetch unfulfilled orders count
  const getUnfulfilledOrdersCount = async () => {
    try {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const orders = orderSnapshot.docs.map((doc) => doc.data());

      // Count orders not equal to "Order Fulfilled"
      return orders.filter((order) => order.currentStage !== 'Order Fulfilled')
        .length;
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      return 0;
    }
  };

  // Fetch "New" inquiries count
  const getNewInquiriesCount = async () => {
    try {
      const inquiriesCollection = collection(db, 'inquiries');
      const inquirySnapshot = await getDocs(inquiriesCollection);
      const inquiries = inquirySnapshot.docs.map((doc) => doc.data());

      // Count inquiries with the status "New"
      return inquiries.filter((inquiry) => inquiry.status === 'New').length;
    } catch (error) {
      console.error('Error fetching inquiries:', error.message);
      return 0;
    }
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'manageOrders':
        return <ManageOrders />;
      case 'manageInquiries':
        return <ManageInquiries />;
      case 'manageProducts':
        return <ManageProducts />;
      case 'salesPipeline':
        return <SalesPipeline />;
      case 'manageUsers':
        return <ManageUsers />;
      case 'manageCarts':
        return <ManageCarts />;
      case 'manageGallery':
        return <ManageGallery />;
      case 'siteSettings':
        return <SiteSettings />;
      default:
        return <div>Select a management option above.</div>;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-cards">
        {[
          {
            name: 'Manage Inquiries',
            icon: FaEnvelope,
            stateKey: 'manageInquiries',
          },
          {
            name: 'Sales Pipeline',
            icon: FaDollarSign,
            stateKey: 'salesPipeline',
          },
          { name: 'Manage Orders', icon: FaBox, stateKey: 'manageOrders' },
          { name: 'Manage Products', icon: FaDrum, stateKey: 'manageProducts' },
          { name: 'Manage Users', icon: FaUsers, stateKey: 'manageUsers' },
          {
            name: 'Manage Carts',
            icon: FaShoppingCart,
            stateKey: 'manageCarts',
          },
          { name: 'Manage Gallery', icon: FaImages, stateKey: 'manageGallery' },
          { name: 'Site Settings', icon: FaCog, stateKey: 'siteSettings' },
        ].map(({ name, icon: Icon, stateKey }) => (
          <div
            key={stateKey}
            className="admin-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveComponent(stateKey)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveComponent(stateKey)}
          >
            <div className="admin-card-icon">
              <Icon />
              {notifications[stateKey] > 0 && (
                <span className="notification-badge">
                  {notifications[stateKey]}
                </span>
              )}
            </div>
            <h3>{name}</h3>
          </div>
        ))}
      </div>
      <div className="component-container">{renderActiveComponent()}</div>
    </div>
  );
};

export default AdminDashboard;