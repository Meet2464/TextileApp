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
import SelectSaree from './SelectSaree';

const { width, height } = Dimensions.get('window');

export default function OrderNoPage({ navigation }) {
  const { userData, getTenantId } = useUser?.() || {};
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [designNo, setDesignNo] = useState('');
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
  const [showSelectSaree, setShowSelectSaree] = useState(false);
  const [selectedOrderForSaree, setSelectedOrderForSaree] = useState(null);

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
      
      setOrdersList(orders);
      setFilteredOrders(orders);
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
    setQuantity(order.quantity.toString());
    setDesignNo(order.designNo);
    setShowEditModal(true);
    setShowPreviewModal(false);
  };

  const handleUpdateOrder = async () => {
    // Validation
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter party name');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Error', 'Please select date');
      return;
    }
    if (!quantity.trim()) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }
    if (!designNo.trim()) {
      Alert.alert('Error', 'Please enter design number');
      return;
    }

    // Validate design number exists in Design No page (designs collection)
    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      const designsRef = tenantId ? query(collection(db, 'designs'), where('companyId', '==', tenantId)) : collection(db, 'designs');
      const designQuery = query(designsRef, where('designNumber', '==', designNo.trim()));
      const designSnap = await getDocs(designQuery);
      if (designSnap.empty) {
        Alert.alert('Error', 'Design No not available. Please add it in Design No page.');
        return;
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
        quantity: parseInt(quantity.trim()),
        designNo: designNo.trim(),
        updatedAt: serverTimestamp(),
      };

      // Update in Firebase Firestore
      await updateDoc(doc(db, 'orders', editingOrder.id), orderData);
      
      Alert.alert('Success', 'Order updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setPartyName('');
            setSelectedDate('');
            setQuantity('');
            setDesignNo('');
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
    setShowInsertModal(true);
  };

  const handleSelectSaree = (order) => {
    setSelectedOrderForSaree(order);
    setShowSelectSaree(true);
  };

  const handleInsertOrder = async () => {
    // Validation
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter party name');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Error', 'Please select date');
      return;
    }
    if (!quantity.trim()) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }
    if (!designNo.trim()) {
      Alert.alert('Error', 'Please enter design number');
      return;
    }

    // Validate design number exists in Design No page (designs collection)
    try {
      const tenantId = (typeof getTenantId === 'function' ? getTenantId() : (userData?.companyId));
      const designsRef = tenantId ? query(collection(db, 'designs'), where('companyId', '==', tenantId)) : collection(db, 'designs');
      const designQuery = query(designsRef, where('designNumber', '==', designNo.trim()));
      const designSnap = await getDocs(designQuery);
      if (designSnap.empty) {
        Alert.alert('Error', 'Design No not available. Please add it in Design No page.');
        return;
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
        quantity: parseInt(quantity.trim()),
        designNo: designNo.trim(),
        createdAt: serverTimestamp(),
        status: 'pending', // You can add more status options
      };

      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, 'orders'), { ...orderData, companyId: tenantId });
      
      console.log('Order saved with ID: ', docRef.id);
      
      Alert.alert('Success', 'Order added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setPartyName('');
            setSelectedDate('');
            setQuantity('');
            setDesignNo('');
    setShowInsertModal(false);
            // Refresh orders list
            loadOrders();
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error saving order: ', error);
      Alert.alert('Error', 'Failed to save order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If SelectSaree page is shown, render it
  if (showSelectSaree) {
    return (
      <SelectSaree 
        navigation={{
          goBack: () => setShowSelectSaree(false)
        }}
        orderData={selectedOrderForSaree}
      />
    );
  }

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
                <Text style={styles.headerCell}>VIEW</Text>
              </View>
              
              {/* Table Rows */}
              {filteredOrders.map((order) => (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.tableRow}
                  onPress={() => handleSelectSaree(order)}
                >
                  <Text style={styles.cell}>{order.poNo}</Text>
                  <Text style={styles.cell}>{order.partyName}</Text>
                  <Text style={styles.cell}>{order.orderDate}</Text>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewOrder(order)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewButtonText}>VIEW</Text>
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

              {/* Quantity Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Design No Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Design No:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Design No"
                  value={designNo}
                  onChangeText={setDesignNo}
                  placeholderTextColor="#999"
                />
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
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Quantity:</Text>
                  <Text style={styles.previewValue}>{selectedOrder.quantity}</Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Design No:</Text>
                  <Text style={styles.previewValue}>{selectedOrder.designNo}</Text>
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

              {/* Quantity Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Design No Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Design No:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter design number"
                  value={designNo}
                  onChangeText={setDesignNo}
                  placeholderTextColor="#999"
                />
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
  inputContainer: {
    marginBottom: 24,
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
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
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
