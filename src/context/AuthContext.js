import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, setAnalyticsUserProperties } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const getUserProjectIds = (profile = {}) => {
  const raw = [
    ...(Array.isArray(profile.projects) ? profile.projects : []),
    ...(Array.isArray(profile.projectIds) ? profile.projectIds : []),
    ...(Array.isArray(profile.assignedProjectIds)
      ? profile.assignedProjectIds
      : []),
    profile.activeProjectId,
    profile.projectId,
    profile.linkedProjectId,
    profile.latestProjectId,
  ].filter(Boolean);

  return Array.from(new Set(raw.map((v) => String(v).trim()).filter(Boolean)));
};

const derivePortalState = (profile = {}) => {
  const portalStatus = String(
    profile.portalStatus || profile.soundlegendPortalStatus || ''
  )
    .trim()
    .toLowerCase();

  const slPortalLocked =
    profile.slPortalLocked === true ||
    profile.portalLocked === true ||
    portalStatus === 'locked';

  const slPortalExpired =
    profile.portalExpired === true ||
    profile.slPortalExpired === true ||
    portalStatus === 'expired' ||
    portalStatus === 'inactive' ||
    portalStatus === 'disabled';

  const projectIds = getUserProjectIds(profile);
  const hasAssignedProject = projectIds.length > 0;

  return {
    portalStatus,
    slPortalLocked,
    slPortalExpired,
    hasAssignedProject,
    projectIds,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSoundlegend, setIsSoundlegend] = useState(false);

  const [authIsReady, setAuthIsReady] = useState(false);
  const [profileIsReady, setProfileIsReady] = useState(false);

  const [portalStatus, setPortalStatus] = useState('');
  const [slPortalLocked, setSlPortalLocked] = useState(false);
  const [slPortalExpired, setSlPortalExpired] = useState(false);
  const [hasAssignedProject, setHasAssignedProject] = useState(false);
  const [assignedProjectIds, setAssignedProjectIds] = useState([]);

  const setAnalyticsRole = (role) => {
    try {
      setAnalyticsUserProperties(role);
    } catch {
      /* noop */
    }
  };

  const clearProfileState = () => {
    setUserProfile(null);
    setProfileIsReady(false);
    setPortalStatus('');
    setSlPortalLocked(false);
    setSlPortalExpired(false);
    setHasAssignedProject(false);
    setAssignedProjectIds([]);
  };

  const applyProfileState = (profile = null) => {
    const safeProfile = profile || {};
    const derived = derivePortalState(safeProfile);

    setUserProfile(profile);
    setPortalStatus(derived.portalStatus);
    setSlPortalLocked(derived.slPortalLocked);
    setSlPortalExpired(derived.slPortalExpired);
    setHasAssignedProject(derived.hasAssignedProject);
    setAssignedProjectIds(derived.projectIds);
    setProfileIsReady(true);
  };

  const loadUserProfile = async (currentUser) => {
    try {
      setProfileIsReady(false);

      if (!currentUser?.uid) {
        applyProfileState(null);
        return;
      }

      const directRef = doc(db, 'users', currentUser.uid);
      const directSnap = await getDoc(directRef);

      if (directSnap.exists()) {
        applyProfileState({ id: directSnap.id, ...directSnap.data() });
        return;
      }

      const normalizedEmail = normalizeEmail(currentUser.email);
      if (normalizedEmail) {
        const usersRef = collection(db, 'users');

        const q1 = query(
          usersRef,
          where('email', '==', normalizedEmail),
          limit(1)
        );
        const snap1 = await getDocs(q1);

        if (!snap1.empty) {
          const match = snap1.docs[0];
          applyProfileState({ id: match.id, ...match.data() });
          return;
        }

        const q2 = query(usersRef, where('email', '==', currentUser.email), limit(1));
        const snap2 = await getDocs(q2);

        if (!snap2.empty) {
          const match = snap2.docs[0];
          applyProfileState({ id: match.id, ...match.data() });
          return;
        }
      }

      applyProfileState(null);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      applyProfileState(null);
    }
  };

  const refreshClaims = async (currentUser) => {
    try {
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const claims = idTokenResult.claims || {};

      const adminStatus = !!(claims.admin || claims.isAdmin);
      const slStatus = !!(claims.soundlegend || claims.isSoundlegend);

      setIsAdmin(adminStatus);
      setIsSoundlegend(slStatus);

      setAnalyticsRole(
        adminStatus ? 'admin' : slStatus ? 'soundlegend' : 'user'
      );
    } catch (error) {
      console.error('❌ Error checking claims:', error);
      setIsAdmin(false);
      setIsSoundlegend(false);
      setAnalyticsRole('guest');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([refreshClaims(currentUser), loadUserProfile(currentUser)]);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSoundlegend(false);
        clearProfileState();
        setAnalyticsRole('guest');
      }

      setAuthIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsSoundlegend(false);
      clearProfileState();
      setAnalyticsRole('guest');
    } catch (error) {
      console.error('❌ Error logging out:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,

        isAdmin,
        isSoundlegend,

        authIsReady,
        profileIsReady,

        portalStatus,
        slPortalLocked,
        slPortalExpired,
        hasAssignedProject,
        assignedProjectIds,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;