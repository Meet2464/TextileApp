import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function WhiteSareeBleach({ navigation, orderData }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>White Saree - Bleach</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222222' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: { 
    padding: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { flex: 1 },
});


