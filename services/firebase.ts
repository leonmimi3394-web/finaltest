
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

// Firebase configuration for adbfc-earning
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
const app = firebase.initializeApp(firebaseConfig);

// Initialize Analytics (Safely)
let analytics;
try {
  if (typeof window !== 'undefined') {
    analytics = firebase.analytics();
  }
} catch (error) {
  console.warn("Firebase Analytics could not be initialized:", error);
}

// Initialize Services
export const auth = app.auth();
export const db = app.firestore();

// Configure Firestore to handle undefined values and work offline
db.settings({ ignoreUndefinedProperties: true });
db.enablePersistence().catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firebase persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firebase persistence not supported by browser');
  }
});

export const googleProvider = new firebase.auth.GoogleAuthProvider();
