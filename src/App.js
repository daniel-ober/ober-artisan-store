import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Shop from './components/Shop';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import SignInEmail from './components/SignInEmail';
import SignInGoogle from './components/SignInGoogle';
import SignUp from './components/SignUp';
import Checkout from './components/Checkout';
import ItemDetail from './components/ItemDetail';
import './App.css'; // Import your CSS file

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addToCart = (item) => {
    const itemExists = cartItems.some(cartItem => cartItem.id === item.id);
    if (!itemExists) {
      setCartItems([...cartItems, item]);
    } else {
      alert('This item is already in your cart!');
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  return (
    <>
      <div className="background-video">
        <video autoPlay loop muted className="background-video-content">
          <source src={isMobile ? '/background-mobile.mp4' : '/background-web.mp4'} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="app-content">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop addToCart={addToCart} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart cartItems={cartItems} removeFromCart={removeFromCart} />} />
          <Route path="/signin-email" element={<SignInEmail />} />
          <Route path="/signin-google" element={<SignInGoogle />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/item/:id" element={<ItemDetail />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
