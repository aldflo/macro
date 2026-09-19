import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCHdbDonyMkrgsowYluSsjrXZtaZDaHxfM",
  authDomain: "macro-bc002.firebaseapp.com",
  projectId: "macro-bc002",
  storageBucket: "macro-bc002.firebasestorage.app",
  messagingSenderId: "3304964771",
  appId: "1:3304964771:web:f144c1ab5d49327a733516",
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();

export const db = getFirestore(app);