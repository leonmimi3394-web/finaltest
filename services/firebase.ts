
import * as firebaseApp from "firebase/app";
import * as firebaseAnalytics from "firebase/analytics";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaUiV2XAhHglRYIFndPzMTy7SR5ADEQjA",
  authDomain: "adbfc-earning.firebaseapp.com",
  databaseURL: "https://adbfc-earning-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adbfc-earning",
  storageBucket: "adbfc-earning.appspot.com",
  messagingSenderId: "487370471539",
  appId: "1:487370471539:web:87b65f736c2e98a3f95206",
  measurementId: "G-N6ZW32K0VQ"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Initialize Analytics (Safely)
let analytics;
try {
  if (typeof window !== 'undefined' && firebaseAnalytics.getAnalytics) {
    analytics = firebaseAnalytics.getAnalytics(app);
  }
} catch (error) {
  console.warn("Firebase Analytics could not be initialized:", error);
}

// Initialize Services
export const auth = firebaseAuth.getAuth(app);

// Initialize Firestore with specific settings
// We use initializeFirestore instead of getFirestore to apply settings immediately
export const db = firebaseFirestore.initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

export const googleProvider = new firebaseAuth.GoogleAuthProvider();

// Export Auth functions to act as a facade and avoid direct package imports in components
export const onAuthStateChanged = firebaseAuth.onAuthStateChanged;
export const signOut = firebaseAuth.signOut;
export const signInWithPopup = firebaseAuth.signInWithPopup;
