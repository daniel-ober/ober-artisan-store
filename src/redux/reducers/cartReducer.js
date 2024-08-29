// src/redux/reducers/cartReducer.js
const initialState = {
  items: [],
  status: 'idle',
  error: null
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'cart/addItem':
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    case 'cart/removeItem':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    case 'cart/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'cart/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

export default cartReducer;
