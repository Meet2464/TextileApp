import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import SelectSaree from './SelectSaree';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function ChalanNoPage({ navigation }) {
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [allowedType, setAllowedType] = useState(null);
  const [showPartyOrder, setShowPartyOrder] = useState(false);

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

  // Empty Party Order page (no details inside as requested)
  if (showPartyOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowPartyOrder(false)}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Party Order</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content} />

        {/* Bottom two-button panel */}
        <View style={styles.bottomPanel}>
          <TouchableOpacity style={styles.pillButton}>
            <Text style={styles.pillText}>Pending data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillButton}>
            <Text style={styles.pillText}>done data</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#fff',
    width: width * 0.8,
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
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
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
});
