import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import ProductDetails from './components/ProductDetails';
import Account from './components/Account';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './App.css';


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

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
      <NavBar isAuthenticated={!!user} onSignOut={() => signOut(auth)} />
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
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/account" element={<Account user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
