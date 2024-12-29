// import { ADD_ITEM, REMOVE_ITEM, UPDATE_ITEM_QUANTITY, CLEAR_CART } from '../actions/cartActions';

// const initialState = {
//     cartItems: [],
//     error: null,
// };

// const cartReducer = (state = initialState, action) => {
//     switch (action.type) {
//         case ADD_ITEM: {
//             const existingItem = state.cartItems.find(item => item.id === action.payload.id);
//             const updatedCart = existingItem
//                 ? state.cartItems.map(item =>
//                       item.id === action.payload.id
//                           ? { ...item, quantity: item.quantity + 1 }
//                           : item
//                   )
//                 : [...state.cartItems, { ...action.payload, quantity: 1 }];
//             return { ...state, cartItems: updatedCart };
//         }
//         case REMOVE_ITEM: {
//             const updatedCart = state.cartItems.filter(item => item.id !== action.payload);
//             return { ...state, cartItems: updatedCart };
//         }
//         case UPDATE_ITEM_QUANTITY: {
//             const updatedCart = state.cartItems.map(item =>
//                 item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
//             );
//             return { ...state, cartItems: updatedCart };
//         }
//         case CLEAR_CART:
//             return { ...state, cartItems: [] };
//         default:
//             return state;
//     }
// };

// export default cartReducer;
