import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDiW4Zei5TXGipX7gQrFq4eqrEzQGimELY",
  authDomain: "shop-9b221.firebaseapp.com",
  databaseURL: "https://shop-9b221-default-rtdb.firebaseio.com",
  projectId: "shop-9b221",
  storageBucket: "shop-9b221.firebasestorage.app",
  messagingSenderId: "259533617394",
  appId: "1:259533617394:web:73fffae7c026c2364cb86b",
  measurementId: "G-VHJWCDVPMC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const ADMIN_EMAIL = "techshivam0616@gmail.com";
