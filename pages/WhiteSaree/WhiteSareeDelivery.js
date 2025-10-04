import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import jecardFirebaseUtils from '../../utils/firebaseJecard';

export default function WhiteSareeDelivery({ navigation }) {
  const { userData } = useUser();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
        const data = await jecardFirebaseUtils.loadDeliveryWhiteRows(tenantId);
        setRows(data);
      } catch {
        setRows([]);
      }
    })();
  }, [userData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>White Saree - Delivery</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>P.O.NO</Text>
            <Text style={styles.headerCell}>CLIENT NAME</Text>
            <Text style={styles.headerCell}>CHALAN NO</Text>
            <Text style={styles.headerCell}>PIECE</Text>
            <Text style={styles.headerCell}>MTR</Text>
          </View>
          {rows.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items in delivery yet.</Text>
              <Text style={styles.emptySubtext}>Items will appear here after being sent from Bleach.</Text>
            </View>
          ) : (
            rows.map((r, idx) => (
              <View key={`row-${idx}`} style={styles.tableRow}>
                <Text style={styles.cell}>{String(r.poNo)}</Text>
                <Text style={styles.cell}>{String(r.clientName || r.partyName || '-')}</Text>
                <Text style={styles.cell}>{String(r.chalanNo || '-')}</Text>
                <Text style={styles.cell}>{String(r.piece || r.qty || '-')}</Text>
                <Text style={styles.cell}>{String(r.mtr || '-')}</Text>
              </View>
            ))
          )}
        </ScrollView>
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
    fontSize: 12,
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
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
