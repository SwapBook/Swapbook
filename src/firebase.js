import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPDBSwj3EbtOiPBfDuXxLXPFBMq3VzvyE",
  authDomain: "swapbook-d41d9.firebaseapp.com",
  projectId: "swapbook-d41d9",
  storageBucket: "swapbook-d41d9.firebasestorage.app",
  messagingSenderId: "829267308830",
  appId: "1:829267308830:web:39d6daefa473092ca9590f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
