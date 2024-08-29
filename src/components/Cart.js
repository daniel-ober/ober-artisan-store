// src/components/Cart.js
import React from 'react';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../redux/selectors/cartSelectors';

const Cart = () => {
  const items = useSelector(selectCartItems);

  return (
    <div>
      <h2>Cart</h2>
      {items.length > 0 ? (
        items.map(item => (
          <div key={item.id}>
            <h3>{item.name}</h3>
            <p>Price: ${item.price}</p>
          </div>
        ))
      ) : (
        <p>No items in cart</p>
      )}
    </div>
  );
};

export default Cart;
