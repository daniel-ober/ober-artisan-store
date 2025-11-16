// src/hooks/usePortalUser.js
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';

export const usePortalUser = () => {
  const { user: authUser } = useAuth();
  const { impersonatedUserId } = useImpersonation();

  const [portalUser, setPortalUser] = useState(authUser || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPortalUser = async () => {
      // Not impersonating? Just use the logged-in user.
      if (!impersonatedUserId) {
        setPortalUser(authUser || null);
        return;
      }

      // Impersonating: load that user's Firestore doc from "users" collection
      setLoading(true);
      try {
        const ref = doc(db, 'users', impersonatedUserId);
        const snap = await getDoc(ref);

        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data() || {};
          setPortalUser({
            uid: impersonatedUserId,
            ...data,
          });
        } else {
          // Fallback to auth user if something's weird
          setPortalUser(authUser || null);
        }
      } catch (err) {
        console.error('Error loading portal user:', err);
        if (!cancelled) {
          setPortalUser(authUser || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPortalUser();

    return () => {
      cancelled = true;
    };
  }, [authUser, impersonatedUserId]);

  return {
    portalUser,            // the user whose portal we’re showing
    loadingPortalUser: loading,
    isImpersonating: !!impersonatedUserId,
  };
};