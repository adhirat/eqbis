// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, query, where, getDocs, updateDoc, deleteDoc, orderBy, limit, onSnapshot, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, GoogleAuthProvider, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDy4XLTYhuT0RMGio_DUQ1rqpD2ZcdQwQ",
    authDomain: "adhirat-website.firebaseapp.com",
    projectId: "adhirat-website",
    storageBucket: "adhirat-website.firebasestorage.app",
    messagingSenderId: "663501027472",
    appId: "1:663501027472:web:dca6b9f02a82d367d94015",
    measurementId: "G-BMYNEG9X4W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export services for use in other modules
export {
    app,
    db,
    storage,
    auth,
    analytics,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    orderBy,
    limit,
    onSnapshot,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    firebaseConfig,
    arrayUnion
};
