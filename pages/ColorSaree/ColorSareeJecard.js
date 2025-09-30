import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
// Removed notifications to avoid Expo Go push limitations
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ColorSareeJecard({ navigation }) {
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
  const [showChallan, setShowChallan] = useState(false);
  const [selectedIds, setSelectedIds] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('jecard_color_rows');
        setRows(raw ? JSON.parse(raw) : []);
        const doneRaw = await AsyncStorage.getItem('jecard_color_done_rows');
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Color Saree - Jecard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>P.O.NO</Text>
            <Text style={styles.headerCell}>D.NO</Text>
            <Text style={styles.headerCell}>PIECE</Text>
            <Text style={styles.headerCell}>MTR</Text>
            <Text style={styles.headerCell}>{activeTab === 'pending' ? 'SEND' : 'DONE'}</Text>
          </View>
          {(activeTab === 'pending' ? rows : doneRows).map((r, idx) => (
            <View
              key={`row-${idx}`}
              style={styles.tableRow}
            >
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
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.cell, { color: '#10B981', fontWeight: '900' }]}>DONE ✓</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {activeTab === 'done' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.smallTagBtn} onPress={() => setShowChallan(true)}>
              <Text style={styles.smallTagText}>Sending challan</Text>
            </TouchableOpacity>
          </View>
        )}

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
                <Text style={styles.previewTitle}>{activeTab === 'pending' ? 'Jecard to Butta Cutting' : 'Party Order Preview'}</Text>
                <TouchableOpacity onPress={() => { setShowPreview(false); setSelectedRow(null); }}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              {activeTab === 'pending' ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Meta rows like Party Order Preview */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#CCCCCC' }}>Order No:</Text>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{String(selectedRow.poNo)}</Text>
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#CCCCCC' }}>P.O. Date:</Text>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{String(selectedRow.orderDate || '-')}</Text>
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#CCCCCC' }}>Party Name:</Text>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{String(selectedRow.partyName || '-')}</Text>
                  </View>
                  {/* Design/Qty table */}
                  <View style={styles.previewTableHeader}>
                    <Text style={styles.previewHeaderCell}>Design No</Text>
                    <Text style={styles.previewHeaderCell}>Qty</Text>
                  </View>
                  <View style={styles.previewTableRow}>
                    <Text style={styles.previewBodyCell}>{String(selectedRow.designNo || '-')}</Text>
                    <Text style={styles.previewBodyCell}>{String(selectedRow.qty || selectedRow.piece || '-')}</Text>
                  </View>
                </>
              )}

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
                    keyboardType="number-pad"
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
                    keyboardType="number-pad"
                    value={mtrVal}
                    onChangeText={setMtrVal}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff5722' }}
                onPress={async () => {
                  try {
                    const pendingKey = 'jecard_color_rows';
                    const doneKey = 'jecard_color_done_rows';
                    const buttaKey = 'butta_color_rows';

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
                    navigation?.navigate?.('ColorSareeButtaCutting');
                  } catch {}
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      {/* Delivery Challan Modal */}
      <Modal visible={showChallan} transparent animationType="fade" onRequestClose={() => setShowChallan(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Delivery Challan</Text>
              <TouchableOpacity onPress={() => setShowChallan(false)}><Text style={styles.closeText}>×</Text></TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Select designs from done data</Text>
                {(doneRows || []).map((r, idx) => {
                  const key = `${r.poNo}-${r.designNo}-${idx}`;
                  const checked = !!selectedIds[key];
                  return (
                    <TouchableOpacity key={key} style={styles.selectRow} activeOpacity={0.8} onPress={() => setSelectedIds((m)=>({ ...m, [key]: !checked }))}>
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <Text style={styles.selectText}>PO {String(r.poNo)} • D.NO {String(r.designNo)} • Piece {String(r.piece || r.qty || '-')} • Mtr {String(r.mtr || '-')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.downloadBtn, { marginTop: 14 }]} activeOpacity={0.9} onPress={async () => {
              const picked = (doneRows || []).filter((r, idx) => selectedIds[`${r.poNo}-${r.designNo}-${idx}`]);
              try {
                const html = buildChallanHtmlFromSelection(picked);
                const nextNo = await getNextChallanNumber();
                const filename = `DC - ${String(nextNo)}.pdf`;
                const savedPath = await savePdfToDownloads(html, filename);
                Alert.alert('Download complete', 'PDF saved to Downloads');
                // Notification removed for Expo Go compatibility
              } catch (e) {
                Alert.alert('PDF', 'Could not save PDF. Please install expo-print and restart (reset cache).');
              }
              setShowChallan(false);
              setSelectedIds({});
            }}>
              <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

async function savePdfToDevice(html) {
  const filename = `DeliveryChallan-${Date.now()}.pdf`;
  const { uri } = await Print.printToFileAsync({ html });

  // Android: Let user pick a folder (e.g., Downloads) and save there via SAF
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        return { ok: true, location: 'Selected folder' };
      }
    } catch (e) {
      // fall back to app storage
    }
  }

  // Fallback: save to app documents
  const dest = FileSystem.documentDirectory + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return { ok: true, location: dest };
}

// Save into Android Downloads using Storage Access Framework when possible
async function savePdfToDownloads(html, overrideName) {
  const filename = overrideName || `DeliveryChallan-${Date.now()}.pdf`;
  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      // Try reuse persisted folder grant
      let directoryUri = await AsyncStorage.getItem('downloads_saf_uri');
      if (!directoryUri) {
        const res = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!res.granted) throw new Error('Permission denied');
        directoryUri = res.directoryUri;
        try { await FileSystem.StorageAccessFramework.persistPermissionsAsync(directoryUri); } catch {}
        await AsyncStorage.setItem('downloads_saf_uri', directoryUri);
      }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        directoryUri,
        filename,
        'application/pdf'
      );
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      return fileUri;
    } catch (e) {}
  }

  // fallback: app documents
  const dest = FileSystem.documentDirectory + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

function buildChallanHtmlImageLike(rows) {
  const rowHtml = (rows || []).map(() => `
    <tr>
      <td style="border:2px solid #000;height:28px;">&nbsp;</td>
      <td style="border:2px solid #000;height:28px;">&nbsp;</td>
      <td style="border:2px solid #000;height:28px;">&nbsp;</td>
      <td style="border:2px solid #000;height:28px;">&nbsp;</td>
      <td style="border:2px solid #000;height:28px;">&nbsp;</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset='utf-8'/>
  <style>
    body{ font-family: Arial, Helvetica, sans-serif; }
    .sheet{ width: 794px; height: 1123px; margin: 0 auto; border: 4px solid #000; padding: 10px; box-sizing: border-box; }
    .title{ text-align:center; font-size:24px; font-weight:700; border-bottom:4px solid #000; padding:8px 0; }
    .box{ border-bottom:4px solid #000; height:140px; }
    .gst{ font-size:20px; font-weight:700; padding:16px; border-bottom:4px solid #000; }
    .meta{ display:flex; justify-content:space-between; padding:16px; border-bottom:4px solid #000; }
    table{ width:100%; border-collapse:collapse; }
    th{ text-align:left; border:2px solid #000; padding:6px; }
    .rows{ border-top:4px solid #000; }
    .sign{ display:flex; justify-content:space-between; margin-top:60px; border-top:4px solid #000; padding-top:40px; }
  </style></head>
  <body>
    <div class='sheet'>
      <div class='title'>Delivery Challan</div>
      <div class='box'></div>
      <div class='gst'>GST No :</div>
      <div class='meta'>
        <div>
          <div>Challan No :</div>
          <div>Client Name :</div>
          <div>Add</div>
        </div>
        <div style='align-self:flex-start;'>Date :</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>P.O. No</th>
            <th>Design No</th>
            <th>Piece</th>
            <th>Mtr</th>
            <th>TP</th>
          </tr>
        </thead>
      </table>
      <table class='rows'>${rowHtml}</table>
      <div class='sign'>
        <div>Receiver's Signature</div>
        <div>Signature</div>
      </div>
    </div>
  </body></html>`;
  return html;
}

// Build a filled challan using selected rows (auto-fills client/challan/date)
function buildChallanHtmlFromSelection(rows) {
  const first = rows && rows[0] ? rows[0] : {};
  const clientName = String(first.clientName || first.partyName || '').trim();
  const challanNo = String(first.chalanNo || first.challanNo || '').trim();
  const rawDate = first.date || first.createdAt || first.dateStr || first.orderDate || '';
  let dateStr = '';
  try {
    if (rawDate) {
      const parsed = Date.parse(rawDate);
      dateStr = isNaN(parsed) ? String(rawDate) : new Date(parsed).toLocaleDateString();
    }
  } catch { dateStr = ''; }

  const filled = (rows || []).map((r) => {
    const po = r.poNo ?? '';
    const dn = r.designNo ?? '';
    const pc = (r.piece ?? r.qty ?? '').toString();
    const mtr = (r.mtr ?? '').toString();
    const tp = (r.tp ?? '').toString();
    return `
      <tr>
        <td style="border:2px solid #000;padding:6px;">${po}</td>
        <td style="border:2px solid #000;padding:6px;">${dn}</td>
        <td style="border:2px solid #000;padding:6px;">${pc}</td>
        <td style="border:2px solid #000;padding:6px;">${mtr}</td>
        <td style="border:2px solid #000;padding:6px;">${tp}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset='utf-8'/>
  <style>
    body{ font-family: Arial, Helvetica, sans-serif; }
    .sheet{ width: 794px; height: 1123px; margin: 0 auto; border: 4px solid #000; padding: 10px; box-sizing: border-box; }
    .title{ text-align:center; font-size:24px; font-weight:700; border-bottom:4px solid #000; padding:8px 0; }
    .line{ border-bottom:4px solid #000; height:0; margin-bottom:12px; }
    .gst{ font-size:20px; font-weight:700; padding:10px 0; border-bottom:4px solid #000; }
    .meta{ display:flex; justify-content:space-between; padding:10px 0; border-bottom:4px solid #000; }
    table{ width:100%; border-collapse:collapse; }
    th{ text-align:left; border:2px solid #000; padding:6px; }
    .rows{ border-top:4px solid #000; }
    .sign{ display:flex; justify-content:space-between; margin-top:40px; border-top:4px solid #000; padding-top:30px; }
  </style></head>
  <body>
    <div class='sheet'>
      <div class='title'>Delivery Challan</div>
      <div class='line'></div>
      <div class='gst'>GST No :</div>
      <div class='meta'>
        <div>
          <div>Challan No : <strong>${challanNo}</strong></div>
          <div>Client Name : <strong>${clientName}</strong></div>
        </div>
        <div style='align-self:flex-start;'>Date : <strong>${dateStr}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>P.O. No</th>
            <th>Design No</th>
            <th>Piece</th>
            <th>Mtr</th>
            <th>TP</th>
          </tr>
        </thead>
      </table>
      <table class='rows'>${filled}</table>
      <div class='sign'>
        <div>Receiver's Signature</div>
        <div>Signature</div>
      </div>
    </div>
  </body></html>`;
  return html;
}

// Auto-incrementing challan number stored locally
async function getNextChallanNumber() {
  const key = 'challan_counter_global';
  try {
    // In-memory cache to avoid race conditions within same session
    const cached = (globalThis.__challanCounter || 0);
    let stored = 0;
    try {
      const raw = await AsyncStorage.getItem(key);
      stored = Math.max(0, parseInt(raw || '0', 10) || 0);
    } catch {}
    const current = Math.max(cached, stored);
    const next = current + 1;
    globalThis.__challanCounter = next;
    await AsyncStorage.setItem(key, String(next));
    return next;
  } catch {
    const fallback = Math.floor(Date.now() / 1000) % 100000;
    globalThis.__challanCounter = fallback;
    return fallback;
  }
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
  actionRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  smallTagBtn: {
    backgroundColor: '#00FFFF',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#7FFFD4',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  smallTagText: {
    color: '#003344',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
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
  // Modal styles for Sending Challan
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  selectText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#7FFFD4',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#00FFFF' },
  checkMark: { color: '#003344', fontSize: 12, fontWeight: '900' },
  downloadBtn: {
    backgroundColor: '#00FFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7FFFD4',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  downloadText: { color: '#003344', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});


