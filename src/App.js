// App.js
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './components/Home'; // Ensure this path is correct
import SignInEmail from './components/SignInEmail'; // Ensure this path is correct
import SignInGoogle from './components/SignInGoogle'; // Ensure this path is correct
import SignUp from './components/SignUp'; // Ensure this path is correct

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin-email" element={<SignInEmail />} />
      <Route path="/signin-google" element={<SignInGoogle />} />
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  );
};

export default App;
