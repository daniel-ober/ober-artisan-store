import { getAuth } from 'firebase/auth';

const CheckUserClaims = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      // ✅ FORCE REFRESH to pull in latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      return tokenResult.claims;
    } catch (error) {
      console.error('Error fetching token claims:', error);
      return null;
    }
  } else {
    return null;
  }
};

export default CheckUserClaims;