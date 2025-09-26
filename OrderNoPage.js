import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { db } from './firebase';
import { useUser } from './contexts/UserContext';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
// SelectSaree is now accessible only via Reports
// Removed Color/White/Garment page imports per request

const { width, height } = Dimensions.get('window');

export default function OrderNoPage({ navigation }) {
  const { userData, getTenantId } = useUser?.() || {};
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [designNos, setDesignNos] = useState(['']);
  const [designQtys, setDesignQtys] = useState(['']);
  const [matchingNos, setMatchingNos] = useState(['']);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showPartyOrderTable, setShowPartyOrderTable] = useState(false);
  const [partyOrderRows, setPartyOrderRows] = useState([]);
  // Removed inline SelectSaree view state
  const [selectedOrderForSaree, setSelectedOrderForSaree] = useState(null);
  // Removed state for Color/White/Garment pages per request
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [activeDesignIdx, setActiveDesignIdx] = useState(null);
  const [tempDesignNo, setTempDesignNo] = useState('');
  const [tempDesignQty, setTempDesignQty] = useState('');
  const [tempMatchingSet, setTempMatchingSet] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const formatDate = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setTempSelectedDate(date);
  };

  const handleDatePickerConfirm = () => {
    if (tempSelectedDate) {
      setSelectedDate(formatDate(tempSelectedDate));
    }
    setShowDatePicker(false);
    setTempSelectedDate(null);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
    setTempSelectedDate(new Date()); // Reset to today's date
  };

  const handleOpenDatePicker = () => {
    const today = new Date();
    setTempSelectedDate(today); // Auto-select today's date when opening
    setCurrentMonth(today.getMonth()); // Set to current month
    setCurrentYear(today.getFullYear()); // Set to current year
    setShowDatePicker(true);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      const ordersQuery = tenantId
        ? query(collection(db, 'orders'), where('companyId', '==', tenantId))
        : query(collection(db, 'orders'));
      const querySnapshot = await getDocs(ordersQuery);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data() // P.O. NO is now stored in database
        });
      });
      
      // Show newest first: higher P.O. NO on top; stable order after edits
      const sorted = orders.sort((a, b) => {
        const aNo = Number(a.poNo) || 0;
        const bNo = Number(b.poNo) || 0;
        return bNo - aNo;
      });
      setOrdersList(sorted);
      setFilteredOrders(sorted);
    } catch (error) {
      console.error('Error loading orders: ', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredOrders(ordersList);
    } else {
      const filtered = ordersList.filter(order => 
        order.partyName.toLowerCase().includes(query.toLowerCase()) ||
        order.designNo.toLowerCase().includes(query.toLowerCase()) ||
        order.orderDate.includes(query)
      );
      setFilteredOrders(filtered);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setSelectedOrder(null);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setPartyName(order.partyName);
    setSelectedDate(order.orderDate);
    setQuantity(String(order?.quantity ?? ''));
    setSelectedCategory(order?.category || '');
    const arr = Array.isArray(order.designNos) && order.designNos.length > 0 ? order.designNos : [order.designNo || ''];
    setDesignNos(arr);
    setDesignQtys(Array.isArray(order.designQtys) ? order.designQtys : new Array(arr.length).fill(''));
    setMatchingNos(Array.isArray(order.matchingNos) ? order.matchingNos : new Array(arr.length).fill(''));
    setShowEditModal(true);
    setShowPreviewModal(false);
  };

  const handleUpdateOrder = async () => {
    // Validation (category removed)
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter party name');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Error', 'Please select date');
      return;
    }
    if (!designNos.some(n => (n || '').trim() !== '')) {
      Alert.alert('Error', 'Please enter at least one design number');
      return;
    }

    // Validate design number exists in Design No page (designs collection)
    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      const validNos = [];
      for (const raw of designNos) {
        const dn = (raw || '').trim();
        if (!dn) continue;
        const designsRef = tenantId ? query(collection(db, 'designs'), where('companyId', '==', tenantId)) : collection(db, 'designs');
        const designQuery = query(designsRef, where('designNumber', '==', dn));
        const designSnap = await getDocs(designQuery);
        if (designSnap.empty) {
          Alert.alert('Error', `Design No ${dn} not available. Please add it in Design No page.`);
          return;
        }
        validNos.push(dn);
      }
    } catch (e) {
      console.error('Error validating design number: ', e);
      Alert.alert('Error', 'Could not validate Design No. Try again.');
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        poNo: editingOrder.poNo, // Preserve existing P.O. NO
        partyName: partyName.trim(),
        orderDate: selectedDate,
        designNo: (designNos.find(n => (n || '').trim()) || '').trim(),
        designNos: designNos.map(n => (n || '').trim()).filter(Boolean),
        designQtys: designQtys.map(n => (n || '').trim()),
        matchingNos: matchingNos.map(n => (n || '').trim()),
        updatedAt: serverTimestamp(),
      };

      // Update in Firebase Firestore
      await updateDoc(doc(db, 'orders', editingOrder.id), orderData);

      // Sync Party Order rows in AsyncStorage for this P.O. NO so Chalan page reflects edits
      try {
        // Build fresh rows from edited data
        const rows = (Array.isArray(orderData.designNos) && orderData.designNos.length > 0
          ? orderData.designNos.map((dn, idx) => ({
              poNo: editingOrder.poNo,
              partyName: orderData.partyName,
              orderDate: orderData.orderDate,
              designNo: String(dn || ''),
              qty: String(orderData.designQtys?.[idx] || ''),
            }))
          : [{
              poNo: editingOrder.poNo,
              partyName: orderData.partyName,
              orderDate: orderData.orderDate,
              designNo: String(orderData.designNo || ''),
              qty: String(quantity || ''),
            }]);
        const cleanRows = rows.filter(r => (r.designNo || '').trim() !== '');

        // Replace in pending list
        const pendingRaw = await AsyncStorage.getItem('party_order_rows');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
        const nextPending = Array.isArray(pending)
          ? [...pending.filter(r => String(r.poNo) !== String(editingOrder.poNo)), ...cleanRows]
          : [...cleanRows];
        await AsyncStorage.setItem('party_order_rows', JSON.stringify(nextPending));

        // Replace in done list as well (if any were already sent)
        const doneRaw = await AsyncStorage.getItem('party_order_done_rows');
        const done = doneRaw ? JSON.parse(doneRaw) : [];
        const nextDone = Array.isArray(done)
          ? [...done.filter(r => String(r.poNo) !== String(editingOrder.poNo)), ...cleanRows]
          : [...cleanRows];
        await AsyncStorage.setItem('party_order_done_rows', JSON.stringify(nextDone));
      } catch (syncErr) {
        console.log('Party Order sync warning:', syncErr?.message || syncErr);
      }
      
      Alert.alert('Success', 'Order updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setPartyName('');
            setSelectedDate('');
            setQuantity('');
            setDesignNos(['']);
            setShowEditModal(false);
            setEditingOrder(null);
            // Refresh orders list
            loadOrders();
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error updating order: ', error);
      Alert.alert('Error', 'Failed to update order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = (order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete Order #${order.poNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'orders', order.id));

              // Remove from Party Order (pending and done) and any Jecard queues
              try {
                const poNoStr = String(order.poNo);
                const pendingRaw = await AsyncStorage.getItem('party_order_rows');
                const doneRaw = await AsyncStorage.getItem('party_order_done_rows');
                const colorRaw = await AsyncStorage.getItem('jecard_color_rows');
                const whiteRaw = await AsyncStorage.getItem('jecard_white_rows');
                const garmentRaw = await AsyncStorage.getItem('jecard_garment_rows');

                const filterOutPo = (arr) =>
                  Array.isArray(arr) ? arr.filter((r) => String(r?.poNo) !== poNoStr) : [];

                await AsyncStorage.setItem('party_order_rows', JSON.stringify(filterOutPo(pendingRaw ? JSON.parse(pendingRaw) : [])));
                await AsyncStorage.setItem('party_order_done_rows', JSON.stringify(filterOutPo(doneRaw ? JSON.parse(doneRaw) : [])));
                await AsyncStorage.setItem('jecard_color_rows', JSON.stringify(filterOutPo(colorRaw ? JSON.parse(colorRaw) : [])));
                await AsyncStorage.setItem('jecard_white_rows', JSON.stringify(filterOutPo(whiteRaw ? JSON.parse(whiteRaw) : [])));
                await AsyncStorage.setItem('jecard_garment_rows', JSON.stringify(filterOutPo(garmentRaw ? JSON.parse(garmentRaw) : [])));
              } catch (storageErr) {
                console.log('Clean-up warning:', storageErr?.message || storageErr);
              }

              Alert.alert('Success', 'Order deleted successfully!');
              handleClosePreview();
              loadOrders(); // Refresh the list
            } catch (error) {
              console.error('Error deleting order: ', error);
              Alert.alert('Error', 'Failed to delete order. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleInsertClick = () => {
    // Reset form for a clean insert state
    setPartyName('');
    setSelectedDate('');
    setQuantity('');
    setDesignNos(['']);
    setDesignQtys(['']);
    setMatchingNos(['']);
    setSelectedCategory('');
    setShowInsertModal(true);
  };

  // Removed open SelectSaree from Order list

  // Removed send-to-party-order flow per request

  const handleInsertOrder = async () => {
    // Validation (category removed)
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter party name');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Error', 'Please select date');
      return;
    }
    if (!designNos.some(n => (n || '').trim() !== '')) {
      Alert.alert('Error', 'Please enter at least one design number');
      return;
    }

    // Validate design number exists in Design No page (designs collection)
    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      for (const raw of designNos) {
        const dn = (raw || '').trim();
        if (!dn) continue;
        const designsRef = tenantId ? query(collection(db, 'designs'), where('companyId', '==', tenantId)) : collection(db, 'designs');
        const designQuery = query(designsRef, where('designNumber', '==', dn));
        const designSnap = await getDocs(designQuery);
        if (designSnap.empty) {
          Alert.alert('Error', `Design No ${dn} not available. Please add it in Design No page.`);
          return;
        }
      }
    } catch (e) {
      console.error('Error validating design number: ', e);
      Alert.alert('Error', 'Could not validate Design No. Try again.');
      return;
    }

    setIsLoading(true);

    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      // Get current orders count to generate P.O. NO
      const ordersQuery = tenantId ? query(collection(db, 'orders'), where('companyId', '==', tenantId)) : query(collection(db, 'orders'));
      const querySnapshot = await getDocs(ordersQuery);
      const nextPoNo = querySnapshot.size + 1;

      // Create order data object
      const orderData = {
        poNo: nextPoNo, // Auto-generated P.O. NO
        partyName: partyName.trim(),
        orderDate: selectedDate,
        designNo: (designNos.find(n => (n || '').trim()) || '').trim(),
        designNos: designNos.map(n => (n || '').trim()).filter(Boolean),
        designQtys: designQtys.map(n => (n || '').trim()),
        matchingNos: matchingNos.map(n => (n || '').trim()),
        createdAt: serverTimestamp(),
        status: 'pending', // You can add more status options
      };

      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, 'orders'), { ...orderData, companyId: tenantId });
      
      console.log('Order saved with ID: ', docRef.id);
      
      // Build Party Order rows (one per design line)
      const rows = (Array.isArray(designNos) && designNos.length > 0
        ? designNos.map((dn, idx) => ({
            poNo: nextPoNo,
            partyName: partyName.trim(),
            orderDate: selectedDate,
            designNo: String(dn || ''),
            qty: String(designQtys?.[idx] || ''),
          }))
        : [{
            poNo: nextPoNo,
            partyName: partyName.trim(),
            orderDate: selectedDate,
            designNo: String((designNos?.[0] || '').trim()),
            qty: String(quantity || ''),
          }]);

      const cleanRows = rows.filter(r => (r.designNo || '').trim() !== '');
      setPartyOrderRows(cleanRows);
      // Persist rows for Chalan → Party Order page (append to existing pending list)
      try {
        const existingRaw = await AsyncStorage.getItem('party_order_rows');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = Array.isArray(existing) ? [...existing, ...cleanRows] : [...cleanRows];
        await AsyncStorage.setItem('party_order_rows', JSON.stringify(merged));
      } catch {}
      setShowInsertModal(false);
      // Optional: could navigate user to Chalan page manually; staying here as requested earlier

      // Reset form and refresh list
      setPartyName('');
      setSelectedDate('');
      setQuantity('');
      setDesignNos(['']);
      setDesignQtys(['']);
      setMatchingNos(['']);
      loadOrders();
      
    } catch (error) {
      console.error('Error saving order: ', error);
      Alert.alert('Error', 'Failed to save order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed SelectSaree rendering from OrderNoPage

  // Direct flow to Color Saree -> Party Order with split designs
  // Removed direct flow to Color Saree Party Order per request

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order No</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
        </View>
        </View>

        {/* Orders Table */}
        <ScrollView style={styles.ordersContainer} showsVerticalScrollIndicator={false}>
          {loadingOrders ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : filteredOrders.length > 0 ? (
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>P.O. NO</Text>
                <Text style={styles.headerCell}>PARTY NAME</Text>
                <Text style={styles.headerCell}>P.O. DATE</Text>
                <Text style={styles.headerCell}>SEND</Text>
              </View>
              
              {/* Table Rows */}
              {filteredOrders.map((order) => (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.tableRow}
                  onPress={() => handleViewOrder(order)}
                >
                  <Text style={styles.cell}>{order.poNo}</Text>
                  <Text style={styles.cell}>{order.partyName}</Text>
                  <Text style={styles.cell}>{order.orderDate}</Text>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewOrder(order)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.viewButtonInner}>
                      <Text style={styles.viewButtonText}>SEND</Text>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No orders found' : 'No orders yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Add your first order using the + button'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Navigation Bar - Only Insert Button */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.insertButton} onPress={handleInsertClick}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Insert Modal */}
      <Modal
        visible={showInsertModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInsertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Order</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowInsertModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* Party Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Party Name:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Party Name"
                  value={partyName}
                  onChangeText={setPartyName}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Select Date Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Date:</Text>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={handleOpenDatePicker}
                >
                  <Text style={[styles.dateInput, selectedDate ? styles.dateInputText : styles.dateInputPlaceholder]}>
                    {selectedDate || 'Select Date'}
                  </Text>
                  <View style={styles.calendarButton}>
                    <Icon name="calendar-outline" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Category selection removed per request */}

              {/* Design No Inputs with Add button */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Design No:</Text>
                <ScrollView style={styles.dynamicList} contentContainerStyle={styles.dynamicListContent}>
                {designNos.map((dn, idx) => (
                  <View key={idx} style={styles.rowInput}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.textInput, { flex: 1, justifyContent: 'center' }]}
                      onPress={() => { 
                        setActiveDesignIdx(idx); 
                        setTempDesignNo(dn || ''); 
                        setTempDesignQty(designQtys[idx] || '');
                        setTempMatchingSet(((matchingNos[idx] || '').split(',').filter(Boolean)) || []);
                        setShowDesignEditor(true); 
                      }}
                    >
                      <Text style={{ color: '#FFFFFF' }}>{(dn || '').trim() || `Design No ${idx + 1}`}</Text>
                    </TouchableOpacity>
                    {(idx === designNos.length - 1) ? (
                      <TouchableOpacity
                        style={styles.smallAddBtn}
                        onPress={() => { setDesignNos((prev) => [...prev, '']); setDesignQtys((prev)=>[...prev,'']); setMatchingNos((prev)=>[...prev,'']); }}
                      >
                        <Icon name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.smallRemoveBtn}
                        onPress={() => { setDesignNos((prev) => prev.filter((_, i) => i !== idx)); setDesignQtys((prev)=>prev.filter((_,i)=>i!==idx)); setMatchingNos((prev)=>prev.filter((_,i)=>i!==idx)); }}
                      >
                        <Text style={styles.smallRemoveText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                </ScrollView>
              </View>
              
              <TouchableOpacity 
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
                onPress={handleInsertOrder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Party Order Table (simple) */}
      <Modal
        visible={showPartyOrderTable}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPartyOrderTable(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Party Order</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPartyOrderTable(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 4 }}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>P.O.NO</Text>
                <Text style={styles.headerCell}>PARTY NAME</Text>
                <Text style={styles.headerCell}>P.O.DATE</Text>
                <Text style={styles.headerCell}>D.NO</Text>
                <Text style={styles.headerCell}>QTY</Text>
                <Text style={styles.headerCell}>SEND</Text>
              </View>
              {partyOrderRows.map((row, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.cell}>{String(row.poNo)}</Text>
                  <Text style={styles.cell}>{String(row.partyName)}</Text>
                  <Text style={styles.cell}>{String(row.orderDate)}</Text>
                  <Text style={styles.cell}>{String(row.designNo)}</Text>
                  <Text style={styles.cell}>{String(row.qty)}</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={[styles.cell, { color: '#00BFFF', fontWeight: '700' }]}>SEND</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={handleDatePickerCancel}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            {/* Header */}
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>SELECT DATE</Text>
              <Text style={styles.datePickerSelectedDate}>
                {tempSelectedDate ? formatDate(tempSelectedDate) : 'Select a date'}
              </Text>
              <TouchableOpacity style={styles.datePickerEditButton}>
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {/* Month/Year Navigation */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateMonth('prev')}>
                  <Icon name="chevron-back" size={20} color="#666" />
                </TouchableOpacity>
                <View style={styles.monthYearContainer}>
                  <Text style={styles.monthYearText}>
                    {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#666" />
                </View>
                <TouchableOpacity onPress={() => navigateMonth('next')}>
                  <Icon name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Days of Week */}
              <View style={styles.daysOfWeekContainer}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
                  const days = [];
                  
                  // Empty cells for days before the first day of the month
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const isSelected = tempSelectedDate && 
                      tempSelectedDate.getDate() === day && 
                      tempSelectedDate.getMonth() === currentMonth && 
                      tempSelectedDate.getFullYear() === currentYear;
                    
                    days.push(
                      <TouchableOpacity
                        key={day}
                        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                        onPress={() => handleDateSelect(day)}
                      >
                        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return days;
                })()}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.datePickerActions}>
              <TouchableOpacity 
                style={styles.datePickerCancelButton}
                onPress={handleDatePickerCancel}
              >
                <Text style={styles.datePickerCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.datePickerOkButton}
                onPress={handleDatePickerConfirm}
              >
                <Text style={styles.datePickerOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Party Order Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClosePreview}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            {/* Header */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Party Order Preview</Text>
              <TouchableOpacity onPress={handleClosePreview} style={styles.previewCloseButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Order Details */}
            {selectedOrder && (
              <View style={styles.previewDetails}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Order No:</Text>
                  <Text style={styles.previewValue}>{selectedOrder.poNo}</Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>P.O. Date:</Text>
                  <Text style={styles.previewValue}>{selectedOrder.orderDate}</Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Party Name:</Text>
                  <Text style={styles.previewValue}>{selectedOrder.partyName}</Text>
                </View>

                {/* Line Items Table */}
                <View style={styles.detailTableContainer}>
                <View style={styles.detailTableHeader}>
                  <Text style={[styles.detailHeaderCell, { flex: 1.5 }]}>Design No</Text>
                  <Text style={[styles.detailHeaderCell, { flex: 1 }]}>Qty</Text>
                </View>

                  {Array.isArray(selectedOrder.designNos) && selectedOrder.designNos.length > 0 ? (
                    selectedOrder.designNos.map((dn, idx) => (
                      <View key={`line-${idx}`} style={styles.detailTableRow}>
                        <Text style={[styles.detailCell, { flex: 1.5 }]}>{String(dn || '')}</Text>
                        <Text style={[styles.detailCell, { flex: 1 }]}>{String(selectedOrder.designQtys?.[idx] || '')}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.detailTableRow}>
                      <Text style={[styles.detailCell, { flex: 1.5 }]}>{String(selectedOrder.designNo || '-')}</Text>
                      <Text style={[styles.detailCell, { flex: 1 }]}>{String(selectedOrder.quantity ?? '-')}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditOrder(selectedOrder)}
              >
                <Icon name="pencil" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteOrder(selectedOrder)}
              >
                <Icon name="trash" size={16} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Send button below Edit/Delete, centered like provided layout */}
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.sendButton, styles.sendButtonSmall]}
                activeOpacity={0.8}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.sendButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Order</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Party Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Party Name:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter party name"
                  value={partyName}
                  onChangeText={setPartyName}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Select Date Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Date:</Text>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={handleOpenDatePicker}
                >
                  <Text style={[styles.dateInput, selectedDate ? styles.dateInputText : styles.dateInputPlaceholder]}>
                    {selectedDate || 'Select Date'}
              </Text>
                  <View style={styles.calendarButton}>
                    <Icon name="calendar-outline" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Category selection removed in Edit modal */}

              

              {/* Design No Inputs (Edit) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Design No:</Text>
                <View style={styles.detailTableContainer}>
                  <View style={styles.detailTableHeader}>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Design No</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 0.8 }]}>Qty</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Matching No</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 0.5 }]}></Text>
                  </View>
                  <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={styles.dynamicListContent}>
                    {designNos.map((dn, idx) => (
                      <View key={`edit-${idx}`} style={[styles.detailTableRow, { alignItems: 'center' }]}>
                        <TouchableOpacity
                          style={{ flex: 1.2 }}
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveDesignIdx(idx);
                            setTempDesignNo(dn || '');
                            setTempDesignQty(designQtys[idx] || '');
                            setTempMatchingSet(((matchingNos[idx] || '').split(',').filter(Boolean)) || []);
                            setShowDesignEditor(true);
                          }}
                        >
                          <Text style={styles.detailCell}>{(dn || '').trim() || `Design No ${idx + 1}`}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 0.8 }}
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveDesignIdx(idx);
                            setTempDesignNo(dn || '');
                            setTempDesignQty(designQtys[idx] || '');
                            setTempMatchingSet(((matchingNos[idx] || '').split(',').filter(Boolean)) || []);
                            setShowDesignEditor(true);
                          }}
                        >
                          <Text style={styles.detailCell}>{String(designQtys[idx] || '')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 1.2 }}
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveDesignIdx(idx);
                            setTempDesignNo(dn || '');
                            setTempDesignQty(designQtys[idx] || '');
                            setTempMatchingSet(((matchingNos[idx] || '').split(',').filter(Boolean)) || []);
                            setShowDesignEditor(true);
                          }}
                        >
                          <Text style={styles.detailCell}>{String(matchingNos[idx] || '').split(',').filter(Boolean).map(s => s.trim()).join(', ')}</Text>
                        </TouchableOpacity>
                        {(idx === designNos.length - 1) ? (
                          <TouchableOpacity
                            style={[styles.smallAddBtn, { width: 36, height: 36 }]}
                            onPress={() => { setDesignNos((prev) => [...prev, '']); setDesignQtys((prev)=>[...prev,'']); setMatchingNos((prev)=>[...prev,'']); }}
                          >
                            <Icon name="add" size={18} color="#fff" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.smallRemoveBtn, { width: 36, height: 36 }]}
                            onPress={() => { setDesignNos((prev) => prev.filter((_, i) => i !== idx)); setDesignQtys((prev)=>prev.filter((_,i)=>i!==idx)); setMatchingNos((prev)=>prev.filter((_,i)=>i!==idx)); }}
                          >
                            <Text style={[styles.smallRemoveText, { marginTop: -2 }]}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
                onPress={handleUpdateOrder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Update Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Design No Editor */}
      <Modal
        visible={showDesignEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDesignEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Design No</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowDesignEditor(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Design No</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Design No ${((activeDesignIdx ?? 0) + 1)}`}
                  value={tempDesignNo}
                  onChangeText={setTempDesignNo}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Quantity"
                  value={tempDesignQty}
                  onChangeText={setTempDesignQty}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              {/* Matching No section removed per request */}
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => {
                  const idx = activeDesignIdx ?? 0;
                  if (!tempDesignQty || String(tempDesignQty).trim() === '') {
                    Alert.alert('Error', 'Please enter Quantity for this design');
                    return;
                  }
                  const nextNos = [...designNos];
                  const nextQtys = [...designQtys];
                  const nextMatch = [...matchingNos];
                  nextNos[idx] = (tempDesignNo || '').trim();
                  nextQtys[idx] = String(tempDesignQty).trim();
                  // Preserve existing matching numbers without editing in this modal
                  setDesignNos(nextNos);
                  setDesignQtys(nextQtys);
                  setMatchingNos(nextMatch);
                  setShowDesignEditor(false);
                }}
              >
                <Text style={styles.sendButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#222222',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  insertButton: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    width: width * 0.9,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 10,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    borderWidth: 1,
    borderColor: '#444444',
  },
  segmentButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#ff5722',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 24,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dynamicList: {
    maxHeight: 200,
    marginTop: 6,
  },
  dynamicListContent: {
    paddingBottom: 6,
  },
  smallAddBtn: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e90ff',
  },
  smallRemoveBtn: {
    backgroundColor: '#dc3545',
    width: 44,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  smallRemoveText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -4,
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  matchChipLight: {
    backgroundColor: '#e9eef6',
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    width: (width * 0.9 - 88) / 5,
    alignItems: 'center',
  },
  matchChipLightText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 13,
  },
  matchChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  matchChipTextActive: {
    color: '#fff',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#555555',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#3A3A3A',
    color: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555555',
    borderRadius: 12,
    backgroundColor: '#3A3A3A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },
  dateInputText: {
    color: '#FFFFFF',
  },
  dateInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  calendarButton: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#555555',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  sendButtonSmall: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    borderColor: '#999',
  },
  // Date Picker Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    width: width * 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  datePickerHeader: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  datePickerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  datePickerSelectedDate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  datePickerEditButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  calendarContainer: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#8B5CF6',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  datePickerCancelButton: {
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerCancelText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerOkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerOkText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#555555',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Table Styles
  ordersContainer: {
    flex: 1,
  },
  tableContainer: {
    paddingHorizontal: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#00BFFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#555555',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  viewButton: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  viewButtonInner: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#555555',
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 72,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Party Order Preview Modal Styles
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#2A2A2A',
    width: width * 0.9,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewCloseButton: {
    padding: 4,
  },
  previewDetails: {
    marginBottom: 24,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  // Detail table inside preview
  detailTableContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailHeaderCell: {
    color: '#00BFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  detailTableRow: {
    flexDirection: 'row',
    backgroundColor: '#2F2F2F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3b3b3b',
  },
  detailCell: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  matchListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  matchPill: {
    backgroundColor: '#0b2533',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  matchPillText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
