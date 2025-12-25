import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. New Unrestricted Key
const firebaseConfig = {
    apiKey: "AIzaSyBSVAyRuOMCZNvEfbq7YYI6_zbqTG4Z53w", // <--- THE NEW KEY
    authDomain: "doorway-detail.firebaseapp.com",
    projectId: "doorway-detail",
    storageBucket: "doorway-detail.firebasestorage.app",
    messagingSenderId: "627401207128",
    appId: "1:627401207128:web:1e8fb3e4f0fc0d5d0c092d"
};

// 2. Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 NEW KEY LOADED:", firebaseConfig.apiKey);

export { db, auth };