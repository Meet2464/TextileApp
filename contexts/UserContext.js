import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { jecardFirebaseUtils } from '../utils/firebaseJecard';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all data from Firebase when user logs in
  const loadAllDataFromFirebase = async (tenantId) => {
    try {
      console.log('Loading all data from Firebase for tenant:', tenantId);
      
      // Load all data types in parallel
      await Promise.all([
        // Party Order data
        jecardFirebaseUtils.loadPartyOrderRows(tenantId),
        jecardFirebaseUtils.loadPartyOrderDoneRows(tenantId),
        
        // Color Saree Jecard data
        jecardFirebaseUtils.loadPendingRows(tenantId),
        jecardFirebaseUtils.loadDoneRows(tenantId),
        
        // White Saree Jecard data
        jecardFirebaseUtils.loadWhiteJecardRows(tenantId),
        jecardFirebaseUtils.loadWhiteJecardDoneRows(tenantId),
        
        // Garment Jecard data
        jecardFirebaseUtils.loadGarmentJecardRows(tenantId),
        
        // Butta Cutting data
        jecardFirebaseUtils.loadButtaColorRows(tenantId),
        jecardFirebaseUtils.loadButtaWhiteRows(tenantId),
        
        // Challan counter
        jecardFirebaseUtils.loadChallanCounter(tenantId)
      ]);
      
      console.log('All data loaded from Firebase successfully');
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
      // Data will fall back to AsyncStorage if Firebase fails
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if employee is active (for employees only)
            // Skip check for new registrations to prevent interference during registration process
            if (userData.role === 'employee' && !userData.isActive && !userData.isNewRegistration) {
              console.log('Employee is not active, signing out:', userData.email);
              // Employee is not active, sign them out
              await signOut(auth);
              setUser(null);
              setUserData(null);
              await AsyncStorage.removeItem('userData');
              setLoading(false);
              return;
            }
            
            setUser(firebaseUser);
            setUserData(userData);
            
            // Store user data in AsyncStorage for persistence
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            
            // Load all data from Firebase after successful login
            const tenantId = userData.companyId || userData.company?.id || userData.companyName || 'default';
            await loadAllDataFromFirebase(tenantId);
          } else {
            // If no user data in Firestore, try to get from AsyncStorage first
            try {
              const storedUserData = await AsyncStorage.getItem('userData');
              if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                
                // Check if employee is active (for employees only)
                // Skip check for new registrations to prevent interference during registration process
                if (userData.role === 'employee' && !userData.isActive && !userData.isNewRegistration) {
                  // Employee is not active, sign them out
                  await signOut(auth);
                  setUser(null);
                  setUserData(null);
                  await AsyncStorage.removeItem('userData');
                  setLoading(false);
                  return;
                }
                
                setUser(firebaseUser);
                setUserData(userData);
                
                // Load all data from Firebase
                const tenantId = userData.companyId || userData.company?.id || userData.companyName || 'default';
                await loadAllDataFromFirebase(tenantId);
              } else {
                // If no stored data, sign out
                await signOut(auth);
                setUser(null);
                setUserData(null);
                await AsyncStorage.removeItem('userData');
              }
            } catch (storageError) {
              console.error('Error reading from storage:', storageError);
              await signOut(auth);
              setUser(null);
              setUserData(null);
            }
          }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                  // If permission denied, sign out the user
                  if (error.code === 'permission-denied') {
                    console.log('Permission denied, signing out user');
                    await signOut(auth);
                    setUser(null);
                    setUserData(null);
                    await AsyncStorage.removeItem('userData');
                    setLoading(false);
                    return;
                  }
                  // If offline or connection issues, try to get data from AsyncStorage
                  if (error.code === 'unavailable' || error.message.includes('offline') || error.code === 'failed-precondition') {
                    try {
                      const storedUserData = await AsyncStorage.getItem('userData');
                      if (storedUserData) {
                        const userData = JSON.parse(storedUserData);
                        
                        // Check if employee is active (for employees only)
                        // Skip check for new registrations to prevent interference during registration process
                        if (userData.role === 'employee' && !userData.isActive && !userData.isNewRegistration) {
                          // Employee is not active, sign them out
                          await signOut(auth);
                          setUser(null);
                          setUserData(null);
                          await AsyncStorage.removeItem('userData');
                          setLoading(false);
                          return;
                        }
                        
                        setUser(firebaseUser);
                        setUserData(userData);
                        console.log('Using cached user data due to offline status');
                        
                        // Try to load data from Firebase even when offline (will use AsyncStorage fallback)
                        const tenantId = userData.companyId || userData.company?.id || userData.companyName || 'default';
                        await loadAllDataFromFirebase(tenantId);
                      } else {
                        // If no cached data and offline, still set user but no userData
                        setUser(firebaseUser);
                        setUserData(null);
                        console.log('User authenticated but no cached data available');
                      }
                    } catch (storageError) {
                      console.error('Error reading from storage:', storageError);
                      setUser(firebaseUser);
                      setUserData(null);
                    }
                  } else {
                    // For other errors, sign out
                    console.error('Critical error, signing out:', error);
                    await signOut(auth);
                    setUser(null);
                    setUserData(null);
                    await AsyncStorage.removeItem('userData');
                  }
                }
      } else {
        setUser(null);
        setUserData(null);
        await AsyncStorage.removeItem('userData');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      await signOut(auth);
      console.log('Firebase signOut successful');
      setUser(null);
      setUserData(null);
      await AsyncStorage.removeItem('userData');
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setUserData(null);
      await AsyncStorage.removeItem('userData');
    }
  };

  const value = {
    user,
    userData,
    loading,
    logout,
    getTenantId: () => {
      const tenant = (userData && (userData.companyId || userData.company?.id || userData.companyName)) || 'default';
      return tenant;
    },
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
