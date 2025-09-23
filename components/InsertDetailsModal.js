import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

export default function InsertDetailsModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [chalanNo, setChalanNo] = useState('');

  const handleSave = () => {
    onSave?.({ name, chalanNo });
    onClose?.();
    setName('');
    setChalanNo('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insert Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.textInput} placeholder="Enter name" placeholderTextColor="#999" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Chalan No</Text>
              <TextInput style={styles.textInput} placeholder="Enter chalan no" placeholderTextColor="#999" value={chalanNo} onChangeText={setChalanNo} />
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={handleSave}>
              <Text style={styles.sendButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});


