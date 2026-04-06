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
        try {
          const profileRef = doc(db, "user_profiles", firebaseUser.uid);
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            setUserProfile({ id: snap.id, ...snap.data() });
          } else {
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
        } catch (err) {
          console.error("Firestore error:", err);
          const fallbackProfile = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || "",
            profile_photo: firebaseUser.photoURL || "",
            profile_completed: false,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          };
          setUserProfile(fallbackProfile);
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
    provider.addScope("email");
    provider.addScope("profile");
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateProfile(data) {
    if (!currentUser) return;
    const ref = doc(db, "user_profiles", currentUser.uid);
    const payload = { ...data, updated_date: new Date().toISOString() };
    try {
      await updateDoc(ref, payload);
    } catch (err) {
      console.error("updateProfile error:", err);
    }
    setUserProfile((prev) => ({ ...prev, ...payload }));
    return payload;
  }

  async function me() {
    if (!currentUs
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
