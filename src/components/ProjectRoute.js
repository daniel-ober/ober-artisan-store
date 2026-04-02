import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const getProjectEmail = (data = {}) =>
  normalizeEmail(data?.customer?.email || data?.customerEmail || '');

const getProjectOwnerUid = (data = {}) =>
  String(
    data?.ownerUid ||
      data?.userId ||
      data?.customerUserId ||
      data?.customer?.uid ||
      ''
  ).trim();

const getUserProjectIds = (userDoc = {}) => {
  const directIds = Array.isArray(userDoc?.projectIds) ? userDoc.projectIds : [];
  const refs = Array.isArray(userDoc?.projects) ? userDoc.projects : [];

  return [...directIds, ...refs]
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : entry?.projectId || entry?.id || entry?.projectID || ''
    )
    .map((id) => String(id || '').trim())
    .filter(Boolean);
};

const getImpersonatedUid = () =>
  String(sessionStorage.getItem('impersonateUid') || '').trim();

const ProjectRoute = ({ element: Component }) => {
  const { user, isAdmin, authIsReady } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    if (!authIsReady) return;

    let cancelled = false;

    const checkAccess = async () => {
      if (!user) {
        navigate('/artisan-portal/signin');
        return;
      }

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          navigate('/not-found');
          return;
        }

        const data = projectSnap.data() || {};
        const impersonatedUid = getImpersonatedUid();

        const effectiveUid =
          isAdmin && impersonatedUid ? impersonatedUid : user.uid;

        const userRef = doc(db, 'users', effectiveUid);
        const userSnap = await getDoc(userRef);
        const userDoc = userSnap.exists() ? userSnap.data() || {} : {};

        const projectEmail = getProjectEmail(data);
        const userEmail = normalizeEmail(userDoc?.email || user?.email || '');
        const projectOwnerUid = getProjectOwnerUid(data);
        const userProjectIds = getUserProjectIds(userDoc);

        const authorizedByUid =
          !!projectOwnerUid && !!effectiveUid && projectOwnerUid === effectiveUid;

        const authorizedByEmail =
          !!projectEmail && !!userEmail && projectEmail === userEmail;

        const authorizedByUserProjects = userProjectIds.includes(
          String(projectId || '').trim()
        );

        const isAuthorized =
          !!isAdmin ||
          authorizedByUid ||
          authorizedByEmail ||
          authorizedByUserProjects;

        if (!isAuthorized) {
          console.warn('🚫 Authorization failed', {
            projectId,
            effectiveUid,
            projectOwnerUid,
            userEmail,
            projectEmail,
            userProjectIds,
            impersonatedUid,
          });
          navigate('/unauthorized');
          return;
        }

        const currentProjects = Array.isArray(userDoc?.projects)
          ? userDoc.projects
          : [];

        const currentProjectIds = Array.isArray(userDoc?.projectIds)
          ? userDoc.projectIds
          : [];

        const normalizedProjectId = String(projectId || '').trim();

        const alreadyLinkedInProjects = currentProjects.some((entry) => {
          const existingId =
            typeof entry === 'string'
              ? entry
              : entry?.projectId || entry?.id || entry?.projectID || '';
          return String(existingId || '').trim() === normalizedProjectId;
        });

        const alreadyLinkedInProjectIds = currentProjectIds.includes(
          normalizedProjectId
        );

        if (!alreadyLinkedInProjects || !alreadyLinkedInProjectIds) {
          await setDoc(
            userRef,
            {
              projectIds: alreadyLinkedInProjectIds
                ? currentProjectIds
                : [...currentProjectIds, normalizedProjectId],
              projects: alreadyLinkedInProjects
                ? currentProjects
                : [
                    ...currentProjects,
                    {
                      projectId: normalizedProjectId,
                      linkedAt: serverTimestamp(),
                    },
                  ],
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (!cancelled) setAuthorized(true);
      } catch (err) {
        console.error('❌ Error checking project access:', err);
        navigate('/error');
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, authIsReady, navigate, projectId]);

  if (!authIsReady || authorized === null) {
    return <div>Loading project...</div>;
  }

  return <Component />;
};

export default ProjectRoute;