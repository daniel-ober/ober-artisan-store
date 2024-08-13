import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <Link to="/signin-google">Google Signin via Single Sign-On(SSO)</Link>
      <Link to="/signin-email">Email Signin (non-SSO)</Link>
      <Link to="/signup">Sign Up</Link>
    </div>
  );
}

export default Home;
