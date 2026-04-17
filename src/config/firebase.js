import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "",
  AIzaSyArv5ZO7zWFAvToPnurWorWJJl8QFh_bJUauthDomain:
    "familiyfree.firebaseapp.com",
  projectId: "familiyfree",
  storageBucket: "familiyfree.firebasestorage.app",
  messagingSenderId: "466765772174",
  appId: "1:466765772174:web:b66d4065fd494aa15f60df",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
