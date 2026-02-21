// @ts-ignore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Create a project and add a Web App
// 3. Copy the 'firebaseConfig' object and replace the one below
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyA_XJxh775nmeZ-I56IgRLx97Zu_oi_vx0",
  authDomain: "pb-invoices-f204f.firebaseapp.com",
  projectId: "pb-invoices-f204f",
  storageBucket: "pb-invoices-f204f.firebasestorage.app",
  messagingSenderId: "590135742863",
  appId: "1:590135742863:web:c3f53492963b7b64adbbfa",
  measurementId: "G-2SGZWL7S1W"
};

// Check if the user has configured the keys
// If the projectId is still the placeholder "your-app-id", we consider it unconfigured.
export const isConfigured = firebaseConfig.projectId !== "your-app-id";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);