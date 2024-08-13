import React, { useContext } from 'react';
import { CartContext } from '../CartContext';

const Shop = () => {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  return (
    <div>
      <h1>Shop</h1>
      <button onClick={() => handleAddToCart({ id: 1, name: 'Product 1' })}>
        Add Product 1 to Cart
      </button>
      <button onClick={() => handleAddToCart({ id: 2, name: 'Product 2' })}>
        Add Product 2 to Cart
      </button>
    </div>
  );
};

export default Shop;
