import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAS8g-gvBwo06ytYZuEKTsY8IjmWhzJBRA",
  authDomain: "macro-77196.firebaseapp.com",
  projectId: "macro-77196",
  storageBucket: "macro-77196.firebasestorage.app",
  messagingSenderId: "288255491086",
  appId: "1:288255491086:web:b277749334ec50d03b505f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();

/* 👇 ESTA ES LA LÍNEA IMPORTANTE */
provider.setCustomParameters({
  prompt: "select_account"
});