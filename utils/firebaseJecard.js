import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get current user's tenant ID for data isolation
const getTenantId = () => {
  // This should be passed from the component or context
  // For now, we'll use a default tenant
  return 'default';
};

// Jecard data operations
export const jecardFirebaseUtils = {
  // Save pending rows to Firebase
  savePendingRows: async (rows, tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'color_pending');
      await setDoc(jecardRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'color_pending'
      });
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('jecard_color_rows', JSON.stringify(rows));
      console.log('Pending rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving pending rows to Firebase:', error);
      // Fallback to AsyncStorage only
      await AsyncStorage.setItem('jecard_color_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Save done rows to Firebase
  saveDoneRows: async (rows, tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'color_done');
      await setDoc(jecardRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'color_done'
      });
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('jecard_color_done_rows', JSON.stringify(rows));
      console.log('Done rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving done rows to Firebase:', error);
      // Fallback to AsyncStorage only
      await AsyncStorage.setItem('jecard_color_done_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Load pending rows from Firebase
  loadPendingRows: async (tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'color_pending');
      const docSnap = await getDoc(jecardRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('jecard_color_rows', JSON.stringify(rows));
        console.log('Pending rows loaded from Firebase successfully');
        return rows;
      } else {
        // If no Firebase data, try AsyncStorage
        const localData = await AsyncStorage.getItem('jecard_color_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading pending rows from Firebase:', error);
      // Fallback to AsyncStorage
      try {
        const localData = await AsyncStorage.getItem('jecard_color_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Load done rows from Firebase
  loadDoneRows: async (tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'color_done');
      const docSnap = await getDoc(jecardRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('jecard_color_done_rows', JSON.stringify(rows));
        console.log('Done rows loaded from Firebase successfully');
        return rows;
      } else {
        // If no Firebase data, try AsyncStorage
        const localData = await AsyncStorage.getItem('jecard_color_done_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading done rows from Firebase:', error);
      // Fallback to AsyncStorage
      try {
        const localData = await AsyncStorage.getItem('jecard_color_done_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Save challan counter to Firebase
  saveChallanCounter: async (counter, tenantId = 'default') => {
    try {
      const counterRef = doc(db, 'tenants', tenantId, 'counters', 'challan');
      await setDoc(counterRef, {
        value: counter,
        lastUpdated: serverTimestamp()
      });
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('challan_counter_global', counter.toString());
      console.log('Challan counter saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving challan counter to Firebase:', error);
      // Fallback to AsyncStorage only
      await AsyncStorage.setItem('challan_counter_global', counter.toString());
      return false;
    }
  },

  // Load challan counter from Firebase
  loadChallanCounter: async (tenantId = 'default') => {
    try {
      const counterRef = doc(db, 'tenants', tenantId, 'counters', 'challan');
      const docSnap = await getDoc(counterRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const counter = data.value || 0;
        
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('challan_counter_global', counter.toString());
        console.log('Challan counter loaded from Firebase successfully');
        return counter;
      } else {
        // If no Firebase data, try AsyncStorage
        const localData = await AsyncStorage.getItem('challan_counter_global');
        return localData ? parseInt(localData, 10) : 0;
      }
    } catch (error) {
      console.error('Error loading challan counter from Firebase:', error);
      // Fallback to AsyncStorage
      try {
        const localData = await AsyncStorage.getItem('challan_counter_global');
        return localData ? parseInt(localData, 10) : 0;
      } catch (localError) {
        console.error('Error loading counter from AsyncStorage:', localError);
        return 0;
      }
    }
  },

  // Sync all data to Firebase (useful for initial setup)
  syncAllDataToFirebase: async (tenantId = 'default') => {
    try {
      // Load from AsyncStorage first
      const pendingData = await AsyncStorage.getItem('jecard_color_rows');
      const doneData = await AsyncStorage.getItem('jecard_color_done_rows');
      const counterData = await AsyncStorage.getItem('challan_counter_global');
      
      const pendingRows = pendingData ? JSON.parse(pendingData) : [];
      const doneRows = doneData ? JSON.parse(doneData) : [];
      const counter = counterData ? parseInt(counterData, 10) : 0;
      
      // Save all to Firebase
      await Promise.all([
        jecardFirebaseUtils.savePendingRows(pendingRows, tenantId),
        jecardFirebaseUtils.saveDoneRows(doneRows, tenantId),
        jecardFirebaseUtils.saveChallanCounter(counter, tenantId)
      ]);
      
      console.log('All data synced to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error syncing data to Firebase:', error);
      return false;
    }
  },

  // Get next challan number with Firebase persistence
  getNextChallanNumber: async (tenantId = 'default') => {
    try {
      // In-memory cache to avoid race conditions within same session
      const cached = (globalThis.__challanCounter || 0);
      let stored = 0;
      
      try {
        stored = await jecardFirebaseUtils.loadChallanCounter(tenantId);
      } catch (error) {
        console.error('Error loading counter from Firebase:', error);
        // Fallback to local storage
        const localData = await AsyncStorage.getItem('challan_counter_global');
        stored = localData ? parseInt(localData, 10) : 0;
      }
      
      const current = Math.max(cached, stored);
      const next = current + 1;
      globalThis.__challanCounter = next;
      
      // Save to Firebase
      await jecardFirebaseUtils.saveChallanCounter(next, tenantId);
      
      return next;
    } catch (error) {
      console.error('Error getting next challan number:', error);
      // Fallback to timestamp-based counter
      const fallback = Math.floor(Date.now() / 1000) % 100000;
      globalThis.__challanCounter = fallback;
      return fallback;
    }
  },

  // Save party order pending rows to Firebase
  savePartyOrderRows: async (rows, tenantId = 'default') => {
    try {
      const partyOrderRef = doc(db, 'tenants', tenantId, 'partyOrder', 'pending');
      await setDoc(partyOrderRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'party_order_pending'
      });
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('party_order_rows', JSON.stringify(rows));
      console.log('Party order pending rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving party order rows to Firebase:', error);
      // Fallback to AsyncStorage only
      await AsyncStorage.setItem('party_order_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Save party order done rows to Firebase
  savePartyOrderDoneRows: async (rows, tenantId = 'default') => {
    try {
      const partyOrderRef = doc(db, 'tenants', tenantId, 'partyOrder', 'done');
      await setDoc(partyOrderRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'party_order_done'
      });
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('party_order_done_rows', JSON.stringify(rows));
      console.log('Party order done rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving party order done rows to Firebase:', error);
      // Fallback to AsyncStorage only
      await AsyncStorage.setItem('party_order_done_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Load party order pending rows from Firebase
  loadPartyOrderRows: async (tenantId = 'default') => {
    try {
      const partyOrderRef = doc(db, 'tenants', tenantId, 'partyOrder', 'pending');
      const docSnap = await getDoc(partyOrderRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('party_order_rows', JSON.stringify(rows));
        console.log('Party order pending rows loaded from Firebase successfully');
        return rows;
      } else {
        // If no Firebase data, try AsyncStorage
        const localData = await AsyncStorage.getItem('party_order_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading party order rows from Firebase:', error);
      // Fallback to AsyncStorage
      try {
        const localData = await AsyncStorage.getItem('party_order_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Load party order done rows from Firebase
  loadPartyOrderDoneRows: async (tenantId = 'default') => {
    try {
      const partyOrderRef = doc(db, 'tenants', tenantId, 'partyOrder', 'done');
      const docSnap = await getDoc(partyOrderRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('party_order_done_rows', JSON.stringify(rows));
        console.log('Party order done rows loaded from Firebase successfully');
        return rows;
      } else {
        // If no Firebase data, try AsyncStorage
        const localData = await AsyncStorage.getItem('party_order_done_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading party order done rows from Firebase:', error);
      // Fallback to AsyncStorage
      try {
        const localData = await AsyncStorage.getItem('party_order_done_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Save white saree jecard rows to Firebase
  saveWhiteJecardRows: async (rows, tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'white_pending');
      await setDoc(jecardRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'white_pending'
      });
      
      await AsyncStorage.setItem('jecard_white_rows', JSON.stringify(rows));
      console.log('White jecard rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving white jecard rows to Firebase:', error);
      await AsyncStorage.setItem('jecard_white_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Load white saree jecard rows from Firebase
  loadWhiteJecardRows: async (tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'white_pending');
      const docSnap = await getDoc(jecardRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        await AsyncStorage.setItem('jecard_white_rows', JSON.stringify(rows));
        console.log('White jecard rows loaded from Firebase successfully');
        return rows;
      } else {
        const localData = await AsyncStorage.getItem('jecard_white_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading white jecard rows from Firebase:', error);
      try {
        const localData = await AsyncStorage.getItem('jecard_white_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Save garment jecard rows to Firebase
  saveGarmentJecardRows: async (rows, tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'garment_pending');
      await setDoc(jecardRef, {
        rows: rows,
        lastUpdated: serverTimestamp(),
        type: 'garment_pending'
      });
      
      await AsyncStorage.setItem('jecard_garment_rows', JSON.stringify(rows));
      console.log('Garment jecard rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving garment jecard rows to Firebase:', error);
      await AsyncStorage.setItem('jecard_garment_rows', JSON.stringify(rows));
      return false;
    }
  },

  // Load garment jecard rows from Firebase
  loadGarmentJecardRows: async (tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'garment_pending');
      const docSnap = await getDoc(jecardRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rows = data.rows || [];
        
        await AsyncStorage.setItem('jecard_garment_rows', JSON.stringify(rows));
        console.log('Garment jecard rows loaded from Firebase successfully');
        return rows;
      } else {
        const localData = await AsyncStorage.getItem('jecard_garment_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading garment jecard rows from Firebase:', error);
      try {
        const localData = await AsyncStorage.getItem('jecard_garment_rows');
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Error loading from AsyncStorage:', localError);
        return [];
      }
    }
  },

  // Save/Load Butta Cutting data (Color)
  saveButtaColorRows: async (rows, tenantId = 'default') => {
    try {
      const buttaRef = doc(db, 'tenants', tenantId, 'workflow', 'butta_color');
      await setDoc(buttaRef, { rows, lastUpdated: serverTimestamp(), type: 'butta_color' });
      await AsyncStorage.setItem('butta_color_rows', JSON.stringify(rows));
      console.log('Butta color rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving butta color rows:', error);
      await AsyncStorage.setItem('butta_color_rows', JSON.stringify(rows));
      return false;
    }
  },

  loadButtaColorRows: async (tenantId = 'default') => {
    try {
      const buttaRef = doc(db, 'tenants', tenantId, 'workflow', 'butta_color');
      const docSnap = await getDoc(buttaRef);
      if (docSnap.exists()) {
        const rows = docSnap.data().rows || [];
        await AsyncStorage.setItem('butta_color_rows', JSON.stringify(rows));
        console.log('Butta color rows loaded from Firebase successfully');
        return rows;
      } else {
        const localData = await AsyncStorage.getItem('butta_color_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading butta color rows:', error);
      try {
        const localData = await AsyncStorage.getItem('butta_color_rows');
        return localData ? JSON.parse(localData) : [];
      } catch { return []; }
    }
  },

  // Save/Load Butta Cutting data (White)
  saveButtaWhiteRows: async (rows, tenantId = 'default') => {
    try {
      const buttaRef = doc(db, 'tenants', tenantId, 'workflow', 'butta_white');
      await setDoc(buttaRef, { rows, lastUpdated: serverTimestamp(), type: 'butta_white' });
      await AsyncStorage.setItem('butta_white_rows', JSON.stringify(rows));
      console.log('Butta white rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving butta white rows:', error);
      await AsyncStorage.setItem('butta_white_rows', JSON.stringify(rows));
      return false;
    }
  },

  loadButtaWhiteRows: async (tenantId = 'default') => {
    try {
      const buttaRef = doc(db, 'tenants', tenantId, 'workflow', 'butta_white');
      const docSnap = await getDoc(buttaRef);
      if (docSnap.exists()) {
        const rows = docSnap.data().rows || [];
        await AsyncStorage.setItem('butta_white_rows', JSON.stringify(rows));
        console.log('Butta white rows loaded from Firebase successfully');
        return rows;
      } else {
        const localData = await AsyncStorage.getItem('butta_white_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading butta white rows:', error);
      try {
        const localData = await AsyncStorage.getItem('butta_white_rows');
        return localData ? JSON.parse(localData) : [];
      } catch { return []; }
    }
  },

  // Save/Load White Jecard Done rows
  saveWhiteJecardDoneRows: async (rows, tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'white_done');
      await setDoc(jecardRef, { rows, lastUpdated: serverTimestamp(), type: 'white_done' });
      await AsyncStorage.setItem('jecard_white_done_rows', JSON.stringify(rows));
      console.log('White jecard done rows saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving white jecard done rows:', error);
      await AsyncStorage.setItem('jecard_white_done_rows', JSON.stringify(rows));
      return false;
    }
  },

  loadWhiteJecardDoneRows: async (tenantId = 'default') => {
    try {
      const jecardRef = doc(db, 'tenants', tenantId, 'jecard', 'white_done');
      const docSnap = await getDoc(jecardRef);
      if (docSnap.exists()) {
        const rows = docSnap.data().rows || [];
        await AsyncStorage.setItem('jecard_white_done_rows', JSON.stringify(rows));
        console.log('White jecard done rows loaded from Firebase successfully');
        return rows;
      } else {
        const localData = await AsyncStorage.getItem('jecard_white_done_rows');
        return localData ? JSON.parse(localData) : [];
      }
    } catch (error) {
      console.error('Error loading white jecard done rows:', error);
      try {
        const localData = await AsyncStorage.getItem('jecard_white_done_rows');
        return localData ? JSON.parse(localData) : [];
      } catch { return []; }
    }
  }
};

export default jecardFirebaseUtils;
