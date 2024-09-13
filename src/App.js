import React, { useState, useEffect } from 'react';
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
import { auth } from './firebaseConfig';
import CheckUserClaims from './checkUserClaims';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import './App.css';

// PrivateRoute component to protect private routes
const PrivateRoute = ({ element }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return user ? element : <Navigate to="/signin" />;
};

// App component with routing
function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const claims = await CheckUserClaims();
          if (claims?.admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking user claims:', error);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    firebaseSignOut(auth).then(() => {
      setUser(null);
      setIsAdmin(false);
    });
  };

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
      <NavBar isAuthenticated={!!user} isAdmin={isAdmin} onSignOut={handleSignOut} />
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
          {isAdmin && (
            <Route
              path="/admin"
              element={<AdminRoute element={<AdminPage />} />}
            />
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
