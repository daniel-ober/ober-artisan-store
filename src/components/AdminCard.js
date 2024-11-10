// // src/components/AdminCard.js

// import React, { useState } from 'react';
// import './AdminCard.css'; // Ensure this path is correct
// import AdminModal from './AdminModal'; // Import the AdminModal component
// import { useAuth } from '../context/AuthContext'; // Import the useAuth hook to access auth context

// const AdminCard = ({ title, icon, isSelected }) => {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [modalType, setModalType] = useState('');
//     const { isAdmin } = useAuth(); // Access the isAdmin status from the Auth context

//     const handleAddClick = (type) => {
//         setModalType(type);
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setModalType(''); // Reset modal type
//     };

//     return (
//         <div className={`admin-card ${isSelected ? 'selected' : ''}`} role="button" tabIndex={0} aria-pressed={isSelected}>
//             <div className="admin-card-icon">{icon}</div>
//             <h2 className="admin-card-title">{title}</h2>

//             {isAdmin && ( // Show buttons only if the user is an admin
//                 <div className="admin-card-buttons">
//                     <button onClick={() => handleAddClick('user')}>Add User</button>
//                     <button onClick={() => handleAddClick('product')}>Add Product</button>
//                     <button onClick={() => handleAddClick('order')}>Add Order</button>
//                 </div>
//             )}

//             {isModalOpen && (
//                 <AdminModal type={modalType} onClose={closeModal} />
//             )}
//         </div>
//     );
// };

// export default AdminCard;
