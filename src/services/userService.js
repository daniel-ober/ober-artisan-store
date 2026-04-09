import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    setDoc,
  } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  
  export const fetchUserDoc = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (!Object.prototype.hasOwnProperty.call(userData, 'isAdmin')) {
          console.warn(`⚠️ User ${userId} does not have an 'isAdmin' field.`);
        }
        return userData;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };
  
  export const updateUserInFirestore = async (userId, updatedData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updatedData);
    } catch (error) {
      throw error;
    }
  };
  
  export const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  };
  
  export const ensureAdminField = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (!Object.prototype.hasOwnProperty.call(userData, 'isAdmin')) {
          await updateDoc(userDocRef, { isAdmin: false });
        }
      }
    } catch (error) {
      // Ignore silently
    }
  };
  
  export const grantAdminAccess = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isAdmin: true });
    } catch (error) {
      // Ignore silently
    }
  };
  
  export const revokeAdminAccess = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isAdmin: false });
    } catch (error) {
      // Ignore silently
    }
  };
  
  export const linkProjectToUserByEmail = async (email, projectId, label) => {
    if (!email || !projectId) return;
  
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const userRef = doc(db, 'users', userDoc.id);
  
        const updatedProjects = [...(userData.projects || [])];
        const alreadyLinked = updatedProjects.some(p => p.projectId === projectId);
  
        if (!alreadyLinked) {
          updatedProjects.push({ projectId, label });
          await updateDoc(userRef, {
            projects: updatedProjects,
          });
          // console.log(`✅ Linked project to existing user: ${email}`);
        }
      } else {
        const newUserRef = doc(collection(db, 'users'));
        await setDoc(newUserRef, {
          email,
          isSoundlegend: true,
          projects: [{ projectId, label }],
        });
        // console.log(`✅ Created new user record for: ${email}`);
      }
    } catch (err) {
      console.error('❌ Error linking project to user:', err);
    }
  };
  