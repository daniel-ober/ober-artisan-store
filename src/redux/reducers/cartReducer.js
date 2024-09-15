// src/redux/reducers/cartReducer.js

import { ADD_ITEM, REMOVE_ITEM, UPDATE_ITEM_QUANTITY } from '../actions/cartActions';

const initialState = {
  cartItems: [],
  cartId: null
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_ITEM:
      return {
        ...state,
        cartItems: [...state.cartItems, action.payload],
        // cartId: generateCartId() // Ensure cartId updates on every change
      };

    case REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.id !== action.payload),
        // cartId: generateCartId() // Update cartId
      };

    case UPDATE_ITEM_QUANTITY:
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        // cartId: generateCartId() // Update cartId
      };

    default:
      return state;
  }
};

const generateCartId = () => {
  return Math.random().toString(36).substr(2, 9); // Simple cartId generator
};

export default cartReducer;
