import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Shop from './components/Shop';
import ItemDetail from './components/ItemDetail';
import Cart from './components/Cart';
import Contact from './components/Contact';
import Home from './components/Home'

function App() {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    // Check if item is already in the cart
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
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />       
        <Route path="/shop" element={<Shop cartItems={cartItems} addToCart={addToCart} />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} removeFromCart={removeFromCart} />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;
