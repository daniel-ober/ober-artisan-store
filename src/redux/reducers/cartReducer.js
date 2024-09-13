const initialState = {
  items: [],
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload),
      };
    // Handle other actions such as INCREASE_QUANTITY and DECREASE_QUANTITY
    default:
      return state;
  }
};

export default cartReducer;
