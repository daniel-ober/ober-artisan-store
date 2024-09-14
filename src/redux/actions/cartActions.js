// src/redux/actions/cartActions.js

export const ADD_ITEM = 'ADD_ITEM';
export const REMOVE_ITEM = 'REMOVE_ITEM';
export const UPDATE_ITEM_QUANTITY = 'UPDATE_ITEM_QUANTITY';

export const addItem = (item) => {
  return {
    type: ADD_ITEM,
    payload: item
  };
};

export const removeItem = (id) => {
  return {
    type: REMOVE_ITEM,
    payload: id
  };
};

export const updateItemQuantity = (id, quantity) => {
  return {
    type: UPDATE_ITEM_QUANTITY,
    payload: { id, quantity }
  };
};
