import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, TextInput, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import InsertDetailsModal from '../../components/InsertDetailsModal';

const { width } = Dimensions.get('window');

export default function GarmentCotting({ navigation, orderData }) {
  const [showInsert, setShowInsert] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Garments - Cotting</Text>
          {orderData && (
            <Text style={styles.headerSubtitle}>Design: {orderData.designNo} | Party: {orderData.partyName}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section} />
        </ScrollView>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.insertButton} onPress={() => setShowInsert(true)}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <InsertDetailsModal visible={showInsert} onClose={() => setShowInsert(false)} onSave={() => Alert.alert('Saved', 'Details captured')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222222' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#222222' },
  backButton: { padding: 8 },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1, backgroundColor: '#2A2A2A', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20 },
  scrollContainer: { flex: 1 },
  section: { paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 16, letterSpacing: 0.5 },
  formCard: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#555555' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#FFFFFF', marginBottom: 8, fontWeight: '600' },
  textInput: { borderWidth: 1, borderColor: '#555555', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#2A2A2A', color: '#FFFFFF', fontSize: 16 },
  sendButton: { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#ff5722' },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  navBar: { flexDirection: 'row', backgroundColor: '#000000', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 20, marginHorizontal: 20, marginTop: 20, marginBottom: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  insertButton: { backgroundColor: '#FF6B35', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8, borderWidth: 1, borderColor: '#ff5722' },
});


