// NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebaseConfig';
import SignOut from './components/SignOut';

function NavBar() {
  const [user] = useAuthState(auth);

  return (
    <nav>      
      <Link to="/signup">Sign Up</Link>
      {user ? <SignOut /> : <a href="/signin-google">Signin with Google</a>}
    </nav>
  );
}

export default NavBar;
