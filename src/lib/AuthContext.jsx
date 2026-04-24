import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Load Firestore profile
        const profileRef = doc(db, "user_profiles", firebaseUser.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...snap.data() });
        } else {
          // Create base profile on first login
          const baseProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || "",
            profile_photo: firebaseUser.photoURL || "",
            profile_completed: false,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          };
          await setDoc(profileRef, baseProfile);
          setUserProfile({ id: firebaseUser.uid, ...baseProfile });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Always show the Google account picker - never silently reuse a session
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    // Clear local state immediately before Firebase signOut
    setCurrentUser(null);
    setUserProfile(null);
    await signOut(auth);
  }

  async function updateProfile(data) {
    if (!currentUser) return;
    const ref = doc(db, "user_profiles", currentUser.uid);
    const payload = { ...data, updated_date: new Date().toISOString() };
    await updateDoc(ref, payload);
    setUserProfile((prev) => ({ ...prev, ...payload }));
    return payload;
  }

  // Mirror the base44 auth.me() API
  async function me() {
    if (!currentUser) return null;
    const ref = doc(db, "user_profiles", currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profile = { id: snap.id, ...snap.data() };
      setUserProfile(profile);
      return profile;
    }
    return userProfile;
  }

  const value = {
    currentUser,
    userProfile,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError: null,
    signInWithGoogle,
    logout,
    updateProfile,
    me,
    navigateToLogin: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
