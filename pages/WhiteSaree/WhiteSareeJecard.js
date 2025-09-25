import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WhiteSareeJecard({ navigation }) {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('jecard_white_rows');
        setRows(raw ? JSON.parse(raw) : []);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>White Saree - Jecard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>P.O.NO</Text>
            <Text style={styles.headerCell}>D.NO</Text>
            <Text style={styles.headerCell}>PIECE</Text>
            <Text style={styles.headerCell}>PREVIEW</Text>
          </View>
          {rows.map((r, idx) => (
            <View key={`row-${idx}`} style={styles.tableRow}>
              <Text style={styles.cell}>{String(r.poNo)}</Text>
              <Text style={styles.cell}>{String(r.designNo)}</Text>
              <Text style={styles.cell}>{String(r.piece || r.qty || '-')}</Text>
              <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => { setSelectedRow(r); setShowPreview(true); }}>
                <Text style={[styles.cell, { color: '#00BFFF', fontWeight: '700' }]}>VIEW</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {showPreview && selectedRow && (
          <View style={styles.previewOverlay}>
            <View style={styles.previewBox}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Order Preview</Text>
                <TouchableOpacity onPress={() => { setShowPreview(false); setSelectedRow(null); }}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.previewTableHeader}>
                <Text style={styles.previewHeaderCell}>P.O.NO</Text>
                <Text style={styles.previewHeaderCell}>PARTY NAME</Text>
                <Text style={styles.previewHeaderCell}>D.NO</Text>
                <Text style={styles.previewHeaderCell}>PIECE</Text>
              </View>
              <View style={styles.previewTableRow}>
                <Text style={styles.previewBodyCell}>{String(selectedRow.poNo)}</Text>
                <Text style={styles.previewBodyCell}>{String(selectedRow.partyName || '-')}</Text>
                <Text style={styles.previewBodyCell}>{String(selectedRow.designNo)}</Text>
                <Text style={styles.previewBodyCell}>{String(selectedRow.piece || selectedRow.qty || '-')}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
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
  backButton: { padding: 6 },
  backText: { color: '#fff', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  cell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  previewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBox: {
    backgroundColor: '#2A2A2A',
    width: '90%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  previewTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  previewTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewHeaderCell: {
    flex: 1,
    color: '#00BFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  previewTableRow: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewBodyCell: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});


