import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WhiteSareeJecard({ navigation }) {
  const [rows, setRows] = useState([]);
  const [doneRows, setDoneRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [clientName, setClientName] = useState('');
  const [chalanNo, setChalanNo] = useState('');
  const [pieceVal, setPieceVal] = useState('');
  const [mtrVal, setMtrVal] = useState('');
  // selection mode removed

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('jecard_white_rows');
        setRows(raw ? JSON.parse(raw) : []);
        const doneRaw = await AsyncStorage.getItem('jecard_white_done_rows');
        setDoneRows(doneRaw ? JSON.parse(doneRaw) : []);
      } catch {
        setRows([]);
        setDoneRows([]);
      }
    })();
  }, []);

  // Auto-calc Mtr based on saved blouse selection for this P.O/Design
  useEffect(() => {
    if (!showPreview || !selectedRow) return;
    const factor = selectedRow?.withBlouse ? 7 : 6;
    const num = Number((pieceVal || '').trim() === '' ? 0 : pieceVal) || 0;
    setMtrVal(pieceVal === '' ? '' : String(num * factor));
  }, [pieceVal, selectedRow, showPreview]);

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
            <Text style={styles.headerCell}>MTR</Text>
            <Text style={styles.headerCell}>{activeTab === 'pending' ? 'SEND' : 'PREVIEW'}</Text>
          </View>
          {(activeTab === 'pending' ? rows : doneRows).map((r, idx) => (
            <View key={`row-${idx}`} style={styles.tableRow}>
              <Text style={styles.cell}>{String(r.poNo)}</Text>
              <Text style={styles.cell}>{String(r.designNo)}</Text>
              <Text style={styles.cell}>{String(r.piece || r.qty || '-')}</Text>
              <Text style={styles.cell}>{String(r.mtr || '-')}</Text>
              {activeTab === 'pending' ? (
                <TouchableOpacity
                  style={{ flex: 1, alignItems: 'center' }}
                  onPress={() => {
                    setSelectedRow(r);
                    setClientName('');
                    setChalanNo('');
                  setPieceVal('');
                  setMtrVal('');
                    setShowPreview(true);
                  }}
                >
                  <Text style={[styles.cell, { color: '#10B981', fontWeight: '700' }]}>SEND</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => { setSelectedRow(r); setShowPreview(true); }}>
                  <Text style={[styles.cell, { color: '#00BFFF', fontWeight: '700' }]}>VIEW</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Bottom two-button panel */}
        <View style={styles.bottomPanel}>
          <TouchableOpacity style={styles.pillButton} onPress={() => setActiveTab('pending')}>
            <Text style={styles.pillText}>Pending data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillButton} onPress={() => setActiveTab('done')}>
            <Text style={styles.pillText}>done data</Text>
          </TouchableOpacity>
        </View>

        {/* selection actions removed */}

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

              {/* Extra fields below preview */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Client Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Client Name"
                  placeholderTextColor="#999"
                  value={clientName}
                  onChangeText={setClientName}
                />
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Chalan No</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Chalan No"
                  placeholderTextColor="#999"
                  value={chalanNo}
                  onChangeText={setChalanNo}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Piece</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={pieceVal}
                    onChangeText={(txt) => {
                      const digits = (txt || '').replace(/[^0-9]/g, '');
                      const max = Number(selectedRow?.piece ?? selectedRow?.qty ?? 0) || 0;
                      const valNum = Number(digits || 0);
                      const clamped = Math.min(valNum, max);
                      setPieceVal(clamped === 0 && digits === '' ? '' : String(clamped));
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mtr</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={mtrVal}
                    onChangeText={setMtrVal}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff5722' }}
                onPress={async () => {
                  try {
                    const pendingKey = 'jecard_white_rows';
                    const doneKey = 'jecard_white_done_rows';
                    const buttaKey = 'butta_white_rows';

                    const pendingRaw = await AsyncStorage.getItem(pendingKey);
                    const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
                    const nextPending = pending.filter((x) => !(String(x.poNo) === String(selectedRow.poNo) && String(x.designNo) === String(selectedRow.designNo)));
                    await AsyncStorage.setItem(pendingKey, JSON.stringify(nextPending));

                    const enriched = { ...selectedRow, clientName, chalanNo, piece: pieceVal, mtr: mtrVal };

                    const doneRaw = await AsyncStorage.getItem(doneKey);
                    const doneList = doneRaw ? JSON.parse(doneRaw) : [];
                    const nextDone = [...doneList, enriched];
                    await AsyncStorage.setItem(doneKey, JSON.stringify(nextDone));

                    const buttaRaw = await AsyncStorage.getItem(buttaKey);
                    const butta = buttaRaw ? JSON.parse(buttaRaw) : [];
                    await AsyncStorage.setItem(buttaKey, JSON.stringify([...butta, {
                      poNo: enriched.poNo,
                      clientName: enriched.clientName || enriched.partyName || '',
                      chalanNo: enriched.chalanNo || '',
                      designNo: enriched.designNo || '',
                      piece: enriched.piece || '',
                      mtr: enriched.mtr || '',
                    }]));

                    setRows(nextPending);
                    setDoneRows(nextDone);
                    setShowPreview(false);
                    setSelectedRow(null);
                    setActiveTab('done');
                    navigation?.navigate?.('WhiteSareeButtaCutting');
                  } catch {}
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
              </TouchableOpacity>
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
  bottomPanel: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 12,
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
});


