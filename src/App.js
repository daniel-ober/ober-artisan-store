import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/Home';
import SignInEmail from './components/SignInEmail';
// import SignInGoogle from './components/SignInGoogle';
import SignUp from './components/SignUp';
import Shop from './components/Shop';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import { AuthenticationContext } from './AuthenticationContext';
import NavBar from './components/NavBar';
import VideoBackground from './components/VideoBackground';


const App = () => {
  const { user } = useContext(AuthenticationContext);

  return (
    <div>
          <VideoBackground />

      <NavBar />
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/" />} />
        <Route path="/signin" element={user ? <Navigate to="/" /> : <SignInEmail />} />
        {/* <Route path="/signin-google" element={user ? <Navigate to="/" /> : <SignInGoogle />} /> */}
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
        {user && (
          <>
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </>
        )}
      </Routes>
    </div>
  );
};

export default App;
