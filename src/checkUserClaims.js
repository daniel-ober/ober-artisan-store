import { getAuth } from 'firebase/auth';

const CheckUserClaims = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims; // Return the token claims
    } catch (error) {
      console.error('Error fetching token claims:', error);
      return null; // Return null in case of error
    }
  } else {
    console.log('No user is signed in.');
    return null; // Return null if no user is signed in
  }
};

export default CheckUserClaims;
