import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Products from './components/Products';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import SignInEmail from './components/SignInEmail';
import SignInGoogle from './components/SignInGoogle';
import ForgotPassword from './components/ForgotPassword';
import Register from './components/Register';
import Checkout from './components/Checkout';
import ProductDetail from './components/ProductDetail';
import AccountPage from './components/AccountPage';
import AdminPage from './components/AdminPage';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';
import './App.css';

// PrivateRoute component to protect private routes
const PrivateRoute = ({ element }) => {
  const { user } = useAuth(); // Use user from AuthContext
  if (!user) {
    return <Navigate to="/signin" />;
  }
  return element;
};

// App component with routing
function App() {
  const { user, handleSignOut } = useAuth(); // Use user and handleSignOut from AuthContext

  return (
    <div className="app-container">
      <div className="background-video-container">
        <video
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
          src="/background-web.mp4"
        />
        <video
          className="background-video-mobile"
          autoPlay
          muted
          loop
          playsInline
          src="/background-mobile.mp4"
        />
      </div>
      <NavBar isAuthenticated={!!user} onSignOut={handleSignOut} />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/signin" element={<SignInEmail />} />
          <Route path="/signin-google" element={<SignInGoogle />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/checkout"
            element={<PrivateRoute element={<Checkout />} />}
          />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/account"
            element={<PrivateRoute element={<AccountPage />} />}
          />
          <Route
            path="/admin"
            element={<PrivateRoute element={<AdminRoute />} />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
