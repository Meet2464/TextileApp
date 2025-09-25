import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import SelectSaree from './SelectSaree';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function ChalanNoPage({ navigation }) {
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [allowedType, setAllowedType] = useState(null);
  const [showPartyOrder, setShowPartyOrder] = useState(false);
  const [partyRows, setPartyRows] = useState([]);
  const [poActiveTab, setPoActiveTab] = useState('pending'); // 'pending' | 'done'
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendCategory, setSendCategory] = useState('color'); // 'color' | 'white' | 'garment'
  const [withBlouse, setWithBlouse] = useState(true);
  const [sendPiece, setSendPiece] = useState('');
  const [sendMtr, setSendMtr] = useState('');
  // Simple close handling for Send modal

  // Auto-calculate Mtr based on Piece and blouse selection for Color/White
  useEffect(() => {
    if (sendCategory === 'garment') return; // garments enter mtr manually
    const pieces = parseInt((sendPiece || '').trim() === '' ? '0' : sendPiece, 10) || 0;
    const factor = withBlouse ? 7 : 6;
    setSendMtr(String(pieces * factor));
  }, [sendPiece, withBlouse, sendCategory]);

  useEffect(() => {
    if (showPartyOrder) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('party_order_rows');
          setPartyRows(raw ? JSON.parse(raw) : []);
        } catch {
          setPartyRows([]);
        }
      })();
    }
  }, [showPartyOrder]);

  const handleInsertClick = () => {
    setShowInsertModal(true);
  };

  const handleInsertChalan = () => {
    // TODO: Implement insert chalan functionality
    console.log('Insert chalan clicked');
    setShowInsertModal(false);
  };

  // SelectSaree view locked to chosen category
  if (showSelect) {
    return (
      <SelectSaree 
        navigation={{ goBack: () => setShowSelect(false) }} 
        allowedType={allowedType}
      />
    );
  }

  // Party Order summary page (reads rows saved from Order page)
  if (showPartyOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowSendModal(false);
              setShowPartyOrder(false);
            }}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Party Order</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={{ flex: 1 }}>
            {poActiveTab === 'pending' ? (
              <View style={{ paddingHorizontal: 10 }}>
                <View style={styles.poTableHeader}>
                  <Text style={styles.poHeaderCell}>P.O.NO</Text>
                  <Text style={styles.poHeaderCell}>PARTY NAME</Text>
                  <Text style={styles.poHeaderCell}>D.NO</Text>
                  <Text style={styles.poHeaderCell}>QTY</Text>
                  <Text style={styles.poHeaderCell}>SEND</Text>
                </View>
                {partyRows.map((row, idx) => (
                  <View key={`prow-${idx}`} style={styles.poTableRow}>
                    <Text style={styles.poCell}>{String(row.poNo)}</Text>
                    <Text style={styles.poCell}>{String(row.partyName)}</Text>
                    <Text style={styles.poCell}>{String(row.designNo)}</Text>
                    <Text style={styles.poCell}>{String(row.qty)}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setShowSendModal(true);
                        setSendCategory('color');
                        setWithBlouse(true);
                        setSendPiece('');
                        setSendMtr('');
                      }}
                      style={{ flex: 1, alignItems: 'center' }}
                    >
                      <Text style={[styles.poCell, { color: '#00BFFF', fontWeight: '700' }]}>SEND</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingHorizontal: 10 }} />
            )}
          </View>

          {/* Bottom two-button panel (sticky at bottom of Party Order) */}
          <View style={styles.bottomPanel}>
            <TouchableOpacity style={styles.pillButton} onPress={() => setPoActiveTab('pending')}>
              <Text style={styles.pillText}>Pending data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={() => setPoActiveTab('done')}>
              <Text style={styles.pillText}>done data</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Send to Jecard Modal (rendered within Party Order branch so it is available) */}
        <Modal
          visible={showSendModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowSendModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send to Jecard</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowSendModal(false)}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 10 }}>
                {/* Category Tabs */}
                <View style={styles.segmentContainer}>
                  {[
                    { id: 'color', label: 'Color Saree' },
                    { id: 'white', label: 'White Saree' },
                    { id: 'garment', label: 'Garments' },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.segmentButton, sendCategory === tab.id && styles.segmentButtonActive]}
                      onPress={() => setSendCategory(tab.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentText, sendCategory === tab.id && styles.segmentTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Content area */}
                {sendCategory === 'garment' ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.inputLabel}>Mtr</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={sendMtr}
                      onChangeText={setSendMtr}
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.inputLabel}>Piece/Mtr</Text>
                    <View style={styles.toggleRow}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, withBlouse && styles.toggleBtnActive]}
                        onPress={() => setWithBlouse(true)}
                      >
                        <Text style={[styles.toggleText, withBlouse && styles.toggleTextActive]}>With blouse</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleBtn, !withBlouse && styles.toggleBtnActive]}
                        onPress={() => setWithBlouse(false)}
                      >
                        <Text style={[styles.toggleText, !withBlouse && styles.toggleTextActive]}>Without blouse</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Piece</Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="numeric"
                          value={sendPiece}
                          onChangeText={setSendPiece}
                          placeholder="0"
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Mtr</Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="numeric"
                          value={sendMtr}
                          onChangeText={setSendMtr}
                          placeholder="0"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.sendButton, { marginTop: 22 }]}
                  onPress={() => setShowSendModal(false)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
        <Text style={styles.headerTitle}>Chalan No</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentCard}>
          <Text style={styles.welcomeText}>Chalan No</Text>
          {/* Party Order button above categories */}
          <TouchableOpacity style={[styles.reportButton, { marginBottom: 18 }]} onPress={() => setShowPartyOrder(true)}>
            <Icon name="people" size={20} color="#FFD700" />
            <Text style={[styles.reportButtonText, { marginLeft: 8 }]}>PARTY ORDER</Text>
          </TouchableOpacity>
          <View style={styles.categoryButtonsWrap}>
            <TouchableOpacity style={styles.reportButton} onPress={() => { setAllowedType('color'); setShowSelect(true); }}>
              <Text style={styles.reportButtonText}>COLOR SAREE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportButton} onPress={() => { setAllowedType('white'); setShowSelect(true); }}>
              <Text style={styles.reportButtonText}>WHITE SAREE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportButton} onPress={() => { setAllowedType('garment'); setShowSelect(true); }}>
              <Text style={styles.reportButtonText}>GARMENTS</Text>
            </TouchableOpacity>
          </View>
        </View>
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
              <Text style={styles.modalTitle}>Insert New Chalan</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowInsertModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                This is where you can insert a new chalan number and details.
              </Text>
              
              <TouchableOpacity style={styles.insertChalanButton} onPress={handleInsertChalan}>
                <Text style={styles.insertChalanButtonText}>Insert Chalan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send to Jecard Modal */}
      <Modal
        visible={showSendModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send to Jecard</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSendModal(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 10 }}>
              {/* Category Tabs */}
              <View style={styles.segmentContainer}>
                {[
                  { id: 'color', label: 'Color Saree' },
                  { id: 'white', label: 'White Saree' },
                  { id: 'garment', label: 'Garments' },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.segmentButton, sendCategory === tab.id && styles.segmentButtonActive]}
                    onPress={() => setSendCategory(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, sendCategory === tab.id && styles.segmentTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Content area */}
              {sendCategory === 'garment' ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.inputLabel}>Mtr</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={sendMtr}
                    onChangeText={setSendMtr}
                    placeholder="0"
                    placeholderTextColor="#999"
                  />
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.inputLabel}>Piece/Mtr</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, withBlouse && styles.toggleBtnActive]}
                      onPress={() => setWithBlouse(true)}
                    >
                      <Text style={[styles.toggleText, withBlouse && styles.toggleTextActive]}>With blouse</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, !withBlouse && styles.toggleBtnActive]}
                      onPress={() => setWithBlouse(false)}
                    >
                      <Text style={[styles.toggleText, !withBlouse && styles.toggleTextActive]}>Without blouse</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Piece</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={sendPiece}
                        onChangeText={setSendPiece}
                        onFocus={() => {
                          if (sendPiece === '0') setSendPiece('');
                        }}
                        onBlur={() => {
                          if ((sendPiece || '').trim() === '') setSendPiece('0');
                        }}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Mtr</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={sendMtr}
                        onChangeText={setSendMtr}
                        onFocus={() => {
                          if (sendCategory === 'garment' && sendMtr === '0') setSendMtr('');
                        }}
                        onBlur={() => {
                          if (sendCategory === 'garment' && (sendMtr || '').trim() === '') setSendMtr('0');
                        }}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.sendButton, { marginTop: 22 }]}
                onPress={() => setShowSendModal(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.sendButtonText}>Send</Text>
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
    backgroundColor: '#222222',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  contentCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPanel: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  pillButton: {
    flex: 1,
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  insertButton: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  insertChalanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  insertChalanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 10,
    width: (width - 70),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#555555',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryButtonsWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  poTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  poHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#00BFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  poTableRow: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  poCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Popup UI styles
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 16,
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
    backgroundColor: '#007AFF',
    borderColor: '#1e90ff',
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
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#2E2E2E',
    borderWidth: 2,
    borderColor: '#3A3A3A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10B981',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#10B981',
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
