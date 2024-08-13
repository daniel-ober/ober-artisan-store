import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/Home'; 
import SignInEmail from './components/SignInEmail';
import SignInGoogle from './components/SignInGoogle';
import SignUp from './components/SignUp';
import NavBar from './NavBar';

const App = () => {
  return (
    <Router> {/* Wrap Routes with BrowserRouter */}
      <NavBar /> {/* Add NavBar here if it should be visible on all pages */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin-email" element={<SignInEmail />} />
        <Route path="/signin-google" element={<SignInGoogle />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
};

export default App;
