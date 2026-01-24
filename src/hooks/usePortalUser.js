// src/hooks/usePortalUser.js
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

/**
 * Portal user loader (customer portal / legacy portal)
 * - Loads users/{uid}
 * - Creates a minimal doc if missing
 * - Normalizes expected fields
 *
 * IMPORTANT:
 * This file exports BOTH a named hook and a default export
 * so you can import either:
 *   import { usePortalUser } from "../../hooks/usePortalUser";
 * or:
 *   import usePortalUser from "../../hooks/usePortalUser";
 */
export function usePortalUser() {
  const { user, isAdmin } = useAuth(); // isAdmin from claims/context
  const [portalUser, setPortalUser] = useState(null);
  const [loadingPortalUser, setLoadingPortalUser] = useState(true);

  // If you’re not using impersonation yet, keep this false for now
  const isImpersonating = false;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingPortalUser(true);

      if (!user?.uid) {
        if (!cancelled) {
          setPortalUser(null);
          setLoadingPortalUser(false);
        }
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        // If no user doc exists, create a minimal one so portal never gets stuck
        if (!snap.exists()) {
          const seed = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            isAdmin: !!isAdmin,
            isSoundlegend: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(ref, seed, { merge: true });

          if (!cancelled) {
            setPortalUser(seed);
            setLoadingPortalUser(false);
          }
          return;
        }

        const data = snap.data() || {};

        // Normalize expected fields (prevents “does not have isAdmin field” issues)
        const normalized = {
          ...data,
          uid: data.uid || user.uid,
          email: data.email || user.email || "",
          displayName: data.displayName || user.displayName || "",
          isAdmin: typeof data.isAdmin === "boolean" ? data.isAdmin : !!isAdmin,
          isSoundlegend:
            typeof data.isSoundlegend === "boolean" ? data.isSoundlegend : false,
        };

        if (!cancelled) {
          setPortalUser(normalized);
          setLoadingPortalUser(false);
        }
      } catch (err) {
        console.error("❌ usePortalUser failed:", err);
        if (!cancelled) {
          setPortalUser(null);
          setLoadingPortalUser(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email, user?.displayName, isAdmin]);

  return { portalUser, loadingPortalUser, isImpersonating };
}

// default export too (so either import style works)
export default usePortalUser;