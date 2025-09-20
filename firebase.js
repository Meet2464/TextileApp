import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration for TextileApp project
const firebaseConfig = {
  apiKey: "AIzaSyAVKB7XEoyYyL_27RsTeRzxCofBHq0-PmE",
  authDomain: "textileapp-2464.firebaseapp.com",
  projectId: "textileapp-2464",
  storageBucket: "textileapp-2464.firebasestorage.app",
  messagingSenderId: "752042436168",
  appId: "1:752042436168:web:0ac4fe8a9e1ba318bc9a7d",
  measurementId: "G-Q60VZP4TGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
// Initialize Analytics only if supported (prevents warnings in React Native)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});
export { analytics };

// Test function to verify Firestore connection
export const testFirestoreConnection = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Firestore connection successful!');
    return true;
  } catch (error) {
    console.error('Firestore connection failed:', error);
    return false;
  }
};

// Function to check stored user data
export const checkStoredUsers = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    console.log('Total users in database:', snapshot.size);
    snapshot.forEach((doc) => {
      console.log('User ID:', doc.id);
      console.log('User Data:', doc.data());
    });
    
    return snapshot.size;
  } catch (error) {
    console.error('Error checking stored users:', error);
    return 0;
  }
};

export default app;
