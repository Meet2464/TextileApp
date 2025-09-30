import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const RECEIVING_STORAGE_KEY = 'receiving_challan_records';

export default function ReceivingChallanList({ navigation }) {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editChallanNo, setEditChallanNo] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editDesignNo, setEditDesignNo] = useState('');
  const [editTp, setEditTp] = useState('');
  const [editMtr, setEditMtr] = useState('');
  const [showRouteList, setShowRouteList] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECEIVING_STORAGE_KEY);
        setRecords(raw ? JSON.parse(raw) : []);
      } catch (e) {
        setRecords([]);
      }
    })();
  }, []);

  const openDetail = (item) => {
    setSelected(item);
    setEditChallanNo(item.challanNo || '');
    setEditRoute(item.route || '');
    setEditDesignNo(item.designNo || '');
    setEditTp(item.tp || '');
    setEditMtr(item.mtr || '');
    setShowDetail(true);
    setShowRouteList(false);
  };

  const saveEdit = async () => {
    const missing = [];
    if (!editChallanNo.trim()) missing.push('Challan No');
    if (!editRoute.trim()) missing.push('Route');
    if (!editDesignNo.trim()) missing.push('Design No');
    if (!editTp.trim()) missing.push('TP');
    if (!editMtr.trim()) missing.push('Mtr');
    if (missing.length > 0) {
      Alert.alert('Missing fields', `Please fill: ${missing.join(', ')}`);
      return;
    }

    try {
      const updated = records.map(r => r.id === selected.id ? {
        ...r,
        challanNo: editChallanNo.trim(),
        route: editRoute.trim(),
        designNo: editDesignNo.trim(),
        tp: editTp.trim(),
        mtr: editMtr.trim(),
      } : r);
      await AsyncStorage.setItem(RECEIVING_STORAGE_KEY, JSON.stringify(updated));
      setRecords(updated);
      setShowDetail(false);
      setSelected(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const deleteRecord = () => {
    Alert.alert('Delete', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const remaining = records.filter(r => r.id !== selected.id);
          await AsyncStorage.setItem(RECEIVING_STORAGE_KEY, JSON.stringify(remaining));
          setRecords(remaining);
          setShowDetail(false);
          setSelected(null);
        } catch (e) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receiving Chllan List</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={{ paddingHorizontal: 10 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Challan</Text>
            <Text style={styles.th}>Route</Text>
            <Text style={styles.th}>D.No</Text>
            <Text style={styles.th}>TP</Text>
            <Text style={styles.th}>Mtr</Text>
          </View>

          {records.map((item) => (
            <TouchableOpacity key={String(item.id)} style={styles.row} activeOpacity={0.8} onPress={() => openDetail(item)}>
              <Text style={styles.td}>{item.challanNo}</Text>
              <Text style={styles.td}>{item.route}</Text>
              <Text style={styles.td}>{item.designNo}</Text>
              <Text style={styles.td}>{item.tp}</Text>
              <Text style={styles.td}>{item.mtr}</Text>
            </TouchableOpacity>
          ))}

          {records.length === 0 && (
            <View style={[styles.row, { justifyContent: 'center' }]}> 
              <Text style={styles.td}>No records</Text>
            </View>
          )}
        </View>
      </View>
      {/* Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setShowDetail(false); setShowRouteList(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receiving Preview</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => { setShowDetail(false); setShowRouteList(false); }}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 10 }}>
              <Text style={styles.inputLabel}>Challan No</Text>
              <TextInput style={[styles.textInput, styles.inputDisabled]} editable={false} value={editChallanNo} placeholder="Enter challan no" placeholderTextColor="#999" />

              <View style={{ height: 16 }} />
              <Text style={styles.inputLabel}>Route</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.textInput, styles.inputDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => {}}
              >
                <Text style={{ color: editRoute ? '#FFFFFF' : '#999999', fontSize: 16 }}>{editRoute || 'Select route'}</Text>
                <Icon name={showRouteList ? 'chevron-up' : 'chevron-down'} size={18} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Dropdown disabled in preview */}

              <View style={{ height: 16 }} />
              <Text style={styles.inputLabel}>Design No</Text>
              <TextInput style={[styles.textInput, styles.inputDisabled]} editable={false} value={editDesignNo} placeholder="Enter design no" placeholderTextColor="#999" />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>TP</Text>
                  <TextInput style={[styles.textInput, styles.inputDisabled]} editable={false} keyboardType="number-pad" value={editTp} placeholder="0" placeholderTextColor="#999" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mtr</Text>
                  <TextInput style={[styles.textInput, styles.inputDisabled]} editable={false} keyboardType="number-pad" value={editMtr} placeholder="0" placeholderTextColor="#999" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                <TouchableOpacity style={[styles.sendButton, { flex: 1 }]} activeOpacity={0.9} onPress={() => { setShowDetail(false); setShowEditModal(true); }}>
                  <Text style={styles.sendButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteButton, { flex: 1 }]} activeOpacity={0.9} onPress={deleteRecord}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Receiving</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 10 }}>
              <Text style={styles.inputLabel}>Challan No</Text>
              <TextInput style={styles.textInput} value={editChallanNo} onChangeText={setEditChallanNo} placeholder="Enter challan no" placeholderTextColor="#999" />

              <View style={{ height: 16 }} />
              <Text style={styles.inputLabel}>Route</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowRouteList(v => !v)}
              >
                <Text style={{ color: editRoute ? '#FFFFFF' : '#999999', fontSize: 16 }}>{editRoute || 'Select route'}</Text>
                <Icon name={showRouteList ? 'chevron-up' : 'chevron-down'} size={18} color="#FFFFFF" />
              </TouchableOpacity>
              {showRouteList && (
                <View style={styles.dropdownList}>
                  {['butta to Jecard', 'bleach to Jecard', 'cotting to Om Sai', 'finish to om sai'].map(opt => (
                    <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setEditRoute(opt); setShowRouteList(false); }}>
                      <Text style={styles.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ height: 16 }} />
              <Text style={styles.inputLabel}>Design No</Text>
              <TextInput style={styles.textInput} value={editDesignNo} onChangeText={setEditDesignNo} placeholder="Enter design no" placeholderTextColor="#999" />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>TP</Text>
                  <TextInput style={styles.textInput} keyboardType="number-pad" value={editTp} onChangeText={setEditTp} placeholder="0" placeholderTextColor="#999" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mtr</Text>
                  <TextInput style={styles.textInput} keyboardType="number-pad" value={editMtr} onChangeText={setEditMtr} placeholder="0" placeholderTextColor="#999" />
                </View>
              </View>

              <View style={{ marginTop: 22 }}>
                <TouchableOpacity style={[styles.sendButton, { width: '100%' }]} activeOpacity={0.9} onPress={async () => { await saveEdit(); setShowEditModal(false); }}>
                  <Text style={styles.sendButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
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
  content: {
    flex: 1,
    backgroundColor: '#222222',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  th: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#00BFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  td: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Modal styles (mirrors app style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#555555',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3A3A3A',
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c82333',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#555555',
    borderRadius: 12,
    backgroundColor: '#2E2E2E',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});


