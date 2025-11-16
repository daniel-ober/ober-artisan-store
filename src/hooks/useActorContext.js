// src/hooks/useActorContext.js
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalUser } from './usePortalUser';

export const useActorContext = () => {
  const { user: authUser, isAdmin } = useAuth();
  const { portalUser, isImpersonating } = usePortalUser();

  return useMemo(
    () => ({
      // Who is actually signed in & clicking “Save”
      actorUid: authUser?.uid ?? null,
      actorEmail: authUser?.email ?? null,
      actorIsAdmin: !!isAdmin,

      // Who the changes are *for* in the portal
      subjectUid: portalUser?.uid ?? portalUser?.id ?? null,
      subjectEmail: portalUser?.email ?? null,

      // Simple flags for your audit trail
      isImpersonating: !!isImpersonating,
      actorRole: isImpersonating ? 'admin-impersonating' : 'user',
    }),
    [authUser, isAdmin, isImpersonating, portalUser]
  );
};