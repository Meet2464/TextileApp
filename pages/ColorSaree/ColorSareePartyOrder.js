import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function ColorSareePartyOrder({ navigation, orderData }) {
  const [showInsert, setShowInsert] = useState(false);
  const [name, setName] = useState('');
  const [chalanNo, setChalanNo] = useState('');
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Color Saree - Party Order</Text>
          {orderData && (
            <Text style={styles.headerSubtitle}>
              Design: {orderData.designNo} | Party: {orderData.partyName}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        </ScrollView>
      </View>
      {/* Bottom Insert Button */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.insertButton} onPress={() => setShowInsert(true)}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Modal visible={showInsert} transparent animationType="slide" onRequestClose={() => setShowInsert(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Insert Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowInsert(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Chalan No</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter chalan no"
                  placeholderTextColor="#999"
                  value={chalanNo}
                  onChangeText={setChalanNo}
                />
              </View>
              <TouchableOpacity style={styles.sendButton} onPress={() => { setShowInsert(false); Alert.alert('Saved', 'Details captured'); }}>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  orderDetails: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555555',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  processInfo: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#555555',
  },
  processDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#555555',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#2F2F2F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#555555',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 22,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2F2F2F',
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
});
