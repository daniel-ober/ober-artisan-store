import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePortalUser() {
  const {
    user,
    userProfile,
    profileIsReady,
    isAdmin,
    isSoundlegend,
  } = useAuth();

  const isImpersonating = useMemo(() => {
    try {
      return !!(isAdmin && sessionStorage.getItem('impersonateUid'));
    } catch {
      return false;
    }
  }, [isAdmin]);

  const portalUser = useMemo(() => {
    if (!user) return null;

    if (userProfile) {
      return {
        ...userProfile,
        uid: userProfile.uid || user.uid,
        id: userProfile.id || user.uid,
        email: userProfile.email || user.email || '',
        fullName:
          userProfile.fullName ||
          userProfile.name ||
          `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() ||
          user.displayName ||
          '',
        isAdmin:
          typeof userProfile.isAdmin === 'boolean'
            ? userProfile.isAdmin
            : !!isAdmin,
        isSoundlegend:
          typeof userProfile.isSoundlegend === 'boolean'
            ? userProfile.isSoundlegend
            : !!isSoundlegend,
      };
    }

    return {
      uid: user.uid,
      id: user.uid,
      email: user.email || '',
      fullName: user.displayName || '',
      firstName: '',
      lastName: '',
      isAdmin: !!isAdmin,
      isSoundlegend: !!isSoundlegend,
      projects: [],
      projectIds: [],
      assignedProjectIds: [],
    };
  }, [user, userProfile, isAdmin, isSoundlegend]);

  return {
    portalUser,
    loadingPortalUser: !profileIsReady,
    isImpersonating,
  };
}

export default usePortalUser;