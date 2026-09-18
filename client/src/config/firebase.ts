import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBvqAdtUNsCqbBnEgQ5Hum52thKj5wEAxw",
  authDomain: "ai-club-database.firebaseapp.com",
  projectId: "ai-club-database",
  storageBucket: "ai-club-database.firebasestorage.app",
  messagingSenderId: "711409645232",
  appId: "1:711409645232:web:ec63b0059eda3f18ae6d75",
  measurementId: "G-DYSZ6FHSB0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
