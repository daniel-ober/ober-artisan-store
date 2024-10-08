// import React from 'react';
// import {
//   Modal,
//   Box,
//   Typography,
//   TextField,
//   Button
// } from '@mui/material';

// const RegisterModal = ({ open, handleClose }) => {
//   const [email, setEmail] = React.useState('');
//   const [password, setPassword] = React.useState('');
//   const [error, setError] = React.useState('');

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError('');
//     console.log('Registering with email:', email); // Debugging log

//     // Handle registration logic here
//     try {
//       // Add your registration logic (e.g., using Firebase) here
//       console.log('Registration successful');
//       handleClose(); // Close modal after successful registration
//     } catch (err) {
//       console.error('Registration error:', err); // Log error details
//       setError('Failed to register. Please try again.');
//     }
//   };

//   return (
//     <Modal open={open} onClose={handleClose}>
//       <Box
//         sx={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           width: 400,
//           bgcolor: 'background.paper',
//           border: '2px solid #000',
//           boxShadow: 24,
//           p: 4,
//         }}
//       >
//         <Typography variant="h6" component="h2">
//           Register
//         </Typography>
//         <form onSubmit={handleRegister}>
//           <TextField
//             label="Email"
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             fullWidth
//             margin="normal"
//             required
//           />
//           <TextField
//             label="Password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             fullWidth
//             margin="normal"
//             required
//           />
//           {error && <Typography color="error">{error}</Typography>}
//           <Button type="submit" variant="contained" color="primary">
//             Register
//           </Button>
//         </form>
//       </Box>
//     </Modal>
//   );
// };

// export default RegisterModal;
