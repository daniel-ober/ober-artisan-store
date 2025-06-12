import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ProjectRoute = ({ element: Component }) => {
  const { user, isAdmin, authIsReady } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null); // null = loading

  useEffect(() => {
    if (!authIsReady) return;

    const checkAccess = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }
    
      if (isAdmin) {
        setAuthorized(true);
        return;
      }
    
      try {
        const projectRef = doc(db, 'projects', projectId);
        const snapshot = await getDoc(projectRef);
    
        if (!snapshot.exists()) {
          navigate('/not-found');
          return;
        }
    
        const data = snapshot.data();
    
        const projectEmail = data?.customer?.email?.toLowerCase()?.trim();
        const userEmail = user?.email?.toLowerCase()?.trim();
    
        console.log('✅ Project email:', projectEmail);
        console.log('✅ User email:', userEmail);
    
        if (projectEmail && userEmail && projectEmail === userEmail) {
          setAuthorized(true);
        } else {
          console.warn('🚫 Authorization failed');
          navigate('/unauthorized');
        }
      } catch (err) {
        console.error('❌ Error checking project access:', err);
        navigate('/error');
      }
    };

    checkAccess();
  }, [user, isAdmin, authIsReady, navigate, projectId]);

  if (!authIsReady || authorized === null) return <div>Loading project...</div>;

  return <Component />;
};

export default ProjectRoute;