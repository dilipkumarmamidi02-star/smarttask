import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCS1q6ahqtJLz1Tah0LQFpX47Uuz8wIc7c",
  authDomain: "smarttask-5f6e3.firebaseapp.com",
  projectId: "smarttask-5f6e3",
  storageBucket: "smarttask-5f6e3.appspot.com",
  messagingSenderId: "941166733163",
  appId: "1:941166733163:web:af31e0d5c1e8d6f557ce2e"
};

const app = initializeApp(firebaseConfig);

// ✅ EXPORT ALL REQUIRED SERVICES
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);