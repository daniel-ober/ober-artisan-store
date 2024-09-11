// src/actions/cartActions.js

// Action to add an item to the cart
export const addToCart = (item) => ({
  type: 'ADD_TO_CART',
  payload: item,
});

// Action to remove an item from the cart
export const removeFromCart = (itemId) => ({
  type: 'REMOVE_FROM_CART',
  payload: itemId,
});
