// src/App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import About from './components/About';
import AccountPage from './components/AccountPage';
import AdminDashboard from './components/AdminDashboard';
import Cart from './components/Cart';
import ChatSupportButton from './components/ChatSupportButton';
import Checkout from './components/Checkout';
import Contact from './components/Contact';
import CustomShopAssistant from './components/CustomShopAssistant';
import Footer from './components/Footer';
import ForgotPassword from './components/ForgotPassword';
import Home from './components/Home';
import ManageOrders from './components/ManageOrders';
import ManageProducts from './components/ManageProducts';
import ManageUsers from './components/ManageUsers';
import NavBar from './components/NavBar';
import NotAuthorized from './components/NotAuthorized';
import NotFound from './components/NotFound';
import PrivacyPolicy from './components/PrivacyPolicy';
import PrivateRoute from './components/PrivateRoute';
import ProductDetail from './components/ProductDetail';
import Products from './components/Products';
import Register from './components/Register';
import ReturnPolicy from './components/ReturnPolicy';
import SignInEmail from './components/SignInEmail';
import SiteSettings from './components/SiteSettings';
import TermsOfService from './components/TermsOfService';
import TransactionSuccess from './components/TransactionSuccess';
import * as AudioPlayer from './components/AudioPlayer'; // Import everything from index.js
import * as firebaseService from './services/firebaseService'; // Import Firebase service functions

function App() {
    const { user, handleSignOut } = useAuth();
    const [currentTab, setCurrentTab] = useState('Home');

    // Expose firebaseService functions globally
    window.firebaseService = firebaseService;

    return (
        <div className="app-container">
            <NavBar 
                isAuthenticated={!!user} 
                onSignOut={handleSignOut} 
                onTabChange={(tab) => setCurrentTab(tab)} 
            />
            <div className="app-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />
                    

                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<ManageUsers />} />
                    <Route path="/admin/products" element={<ManageProducts />} />
                    <Route path="/admin/orders" element={<ManageOrders />} />
                    <Route path="/admin/settings" element={<SiteSettings />} />
                        
                    {/* <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} adminOnly />} />
                    <Route path="/admin/users" element={<PrivateRoute element={<ManageUsers />} adminOnly />} />
                    <Route path="/admin/products" element={<PrivateRoute element={<ManageProducts />} adminOnly />} />
                    <Route path="/admin/orders" element={<PrivateRoute element={<ManageOrders />} adminOnly />} />
                    <Route path="/admin/settings" element={<PrivateRoute element={<SiteSettings />} adminOnly />} /> */}
                    <Route path="/about" element={<About />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<PrivateRoute element={<Checkout />} />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/custom-shop-assistant" element={<PrivateRoute element={<CustomShopAssistant />} adminOnly />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/mixing-booth" element={<PrivateRoute element={<AudioPlayer.Mixer />} adminOnly />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/return-policy" element={<ReturnPolicy />} />
                    <Route path="/signin" element={<SignInEmail />} />
                    <Route path="/success" element={<TransactionSuccess />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <ChatSupportButton currentTab={currentTab} /> {/* Pass currentTab here */}
            <Footer />
        </div>
    );
}

export default App;
