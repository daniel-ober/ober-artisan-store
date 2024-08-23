// src/App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import SignInEmail from './components/SignInEmail';
import SignUp from './components/SignUp';
import Shop from './components/Shop';
import Cart from './components/Cart';
import ItemDetail from './components/ItemDetail';
import NavBar from './components/NavBar';
import VideoBackground from './components/VideoBackground';
import About from './components/About';

const App = () => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems((prevItems) => [...prevItems, item]);
  };

  return (
    <div>
      <VideoBackground />
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/signin" element={<SignInEmail />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/shop" element={<Shop addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} />} />
      </Routes>
    </div>
  );
};

export default App;
