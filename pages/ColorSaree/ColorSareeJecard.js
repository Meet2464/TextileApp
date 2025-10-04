import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
// Removed notifications to avoid Expo Go push limitations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import jecardFirebaseUtils from '../../utils/firebaseJecard';

export default function ColorSareeJecard({ navigation }) {
  const { userData } = useUser();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
      
      // Load data from Firebase with AsyncStorage fallback
      const [pendingRows, doneRowsData] = await Promise.all([
        jecardFirebaseUtils.loadPendingRows(tenantId),
        jecardFirebaseUtils.loadDoneRows(tenantId)
      ]);
      
      setRows(pendingRows);
      setDoneRows(doneRowsData);
      
      // If no data in Firebase, try to sync existing AsyncStorage data
      if (pendingRows.length === 0 && doneRowsData.length === 0) {
        await jecardFirebaseUtils.syncAllDataToFirebase(tenantId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to AsyncStorage only
      try {
        const raw = await AsyncStorage.getItem('jecard_color_rows');
        setRows(raw ? JSON.parse(raw) : []);
        const doneRaw = await AsyncStorage.getItem('jecard_color_done_rows');
        setDoneRows(doneRaw ? JSON.parse(doneRaw) : []);
      } catch {
        setRows([]);
        setDoneRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-calc Mtr based on saved blouse selection for this P.O/Design
  useEffect(() => {
    if (!showPreview || !selectedRow) return;
    const factor = selectedRow?.withBlouse ? 7 : 6;
    const num = Number((pieceVal || '').trim() === '' ? 0 : pieceVal) || 0;
    setMtrVal(pieceVal === '' ? '' : String(num * factor));
  }, [pieceVal, selectedRow, showPreview]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Color Saree - Jecard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.body, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Loading data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backText}>{'<'}</Text>
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
            <Text style={styles.headerCell}>{activeTab === 'pending' ? 'SEND' : 'STATUS'}</Text>
          </View>
          {(activeTab === 'pending' ? rows : doneRows).map((r, idx) => (
            <TouchableOpacity 
              key={`row-${idx}`} 
              style={styles.tableRow}
              onPress={() => {
                if (activeTab === 'done') {
                  setSelectedRow(r);
                  setShowPreview(true);
                } else {
                  setSelectedRow(r);
                  setClientName('');
                  setChalanNo('');
                  setPieceVal('');
                  setMtrVal('');
                  setShowPreview(true);
                }
              }}
              activeOpacity={activeTab === 'done' ? 0.7 : 1}
              disabled={activeTab === 'pending'}
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
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.cell, { color: r.pdfDownloaded ? '#10B981' : 'transparent', fontWeight: '700' }]}>
                    {r.pdfDownloaded ? 'Done' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'pending' && (
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

              {activeTab === 'pending' && (
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff5722' }}
                onPress={async () => {
                  try {
                    const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
                    const pendingKey = 'jecard_color_rows';
                    const doneKey = 'jecard_color_done_rows';
                    const buttaKey = 'butta_color_rows';

                    // Get current data
                    const pendingRaw = await AsyncStorage.getItem(pendingKey);
                    const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
                    const nextPending = pending.filter((x) => !(String(x.poNo) === String(selectedRow.poNo) && String(x.designNo) === String(selectedRow.designNo)));

                    const enriched = { ...selectedRow, clientName, chalanNo, piece: pieceVal, mtr: mtrVal };

                    const doneRaw = await AsyncStorage.getItem(doneKey);
                    const doneList = doneRaw ? JSON.parse(doneRaw) : [];
                    const nextDone = [...doneList, enriched];

                    // Update AsyncStorage
                    await AsyncStorage.setItem(pendingKey, JSON.stringify(nextPending));
                    await AsyncStorage.setItem(doneKey, JSON.stringify(nextDone));

                    // Save to Firebase
                    await Promise.all([
                      jecardFirebaseUtils.savePendingRows(nextPending, tenantId),
                      jecardFirebaseUtils.saveDoneRows(nextDone, tenantId)
                    ]);

                    // Update butta data and save to Firebase
                    const butta = await jecardFirebaseUtils.loadButtaColorRows(tenantId);
                    const newButtaRow = {
                      poNo: enriched.poNo,
                      clientName: enriched.clientName || enriched.partyName || '',
                      chalanNo: enriched.chalanNo || '',
                      designNo: enriched.designNo || '',
                      piece: enriched.piece || '',
                      mtr: enriched.mtr || '',
                    };
                    await jecardFirebaseUtils.saveButtaColorRows([...butta, newButtaRow], tenantId);

                    setRows(nextPending);
                    setDoneRows(nextDone);
                    setShowPreview(false);
                    setSelectedRow(null);
                    setActiveTab('done');
                    navigation?.navigate?.('ColorSareeButtaCutting');
                  } catch (error) {
                    console.error('Error saving data:', error);
                    Alert.alert('Error', 'Failed to save data. Please try again.');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
              </TouchableOpacity>
              )}
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
                {(doneRows || []).filter(r => !r.pdfDownloaded).length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>
                      {doneRows.length === 0 
                        ? 'No items in done data yet.\nSend items from pending data first.' 
                        : 'All items have been downloaded.\nNo new items available.'}
                    </Text>
                  </View>
                ) : (
                  (doneRows || []).filter(r => !r.pdfDownloaded).map((r, idx) => {
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
                  })
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.downloadBtn, { marginTop: 14 }]} activeOpacity={0.9} onPress={async () => {
              // Get only the items that are checked
              const availableRows = (doneRows || []).filter(r => !r.pdfDownloaded);
              const picked = availableRows.filter((r, idx) => selectedIds[`${r.poNo}-${r.designNo}-${idx}`]);
              
              if (picked.length === 0) {
                Alert.alert('No Selection', 'Please select at least one item to download.');
                return;
              }
              
              try {
                const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
                const html = buildChallanHtmlFromSelection(picked);
                
                // Get next Color Butta counter
                const buttaCounterRef = await AsyncStorage.getItem('butta_challan_counter_color');
                const nextNo = buttaCounterRef ? parseInt(buttaCounterRef) + 1 : 1;
                await AsyncStorage.setItem('butta_challan_counter_color', String(nextNo));
                
                const filename = `C Butta - ${String(nextNo)}.pdf`;
                const savedPath = await savePdfToDownloads(html, filename);
                
                // Mark selected rows as PDF downloaded (match by poNo and designNo)
                const selectedPoDesigns = picked.map(p => `${p.poNo}-${p.designNo}`);
                const updatedDoneRows = doneRows.map((r) => {
                  const rowKey = `${r.poNo}-${r.designNo}`;
                  if (selectedPoDesigns.includes(rowKey)) {
                    return { ...r, pdfDownloaded: true };
                  }
                  return r;
                });
                
                // Save updated done rows to Firebase
                await jecardFirebaseUtils.saveDoneRows(updatedDoneRows, tenantId);
                setDoneRows(updatedDoneRows);
                
                Alert.alert('Download complete', `PDF saved as ${filename}`);
                // Notification removed for Expo Go compatibility
              } catch (e) {
                console.error('PDF generation error:', e);
                Alert.alert('PDF Error', 'Could not save PDF. Please try again.');
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

  // Calculate totals
  let totalPiece = 0;
  let totalMtr = 0;
  let totalTakka = 0;

  // Build table rows with data
  const tableRows = (rows || []).map((r) => {
    const po = r?.poNo ?? '';
    const dn = r?.designNo ?? '';
    const pc = Number(r?.piece ?? r?.qty ?? 0) || 0;
    const mtr = Number(r?.mtr ?? 0) || 0;
    const takka = Number(r?.takka ?? 0) || 0;
    
    totalPiece += pc;
    totalMtr += mtr;
    totalTakka += takka;
    
    return `
      <div class="table-row">
        <div class="table-cell po-no">${po}</div>
        <div class="table-cell design-no">${dn}</div>
        <div class="table-cell takka">${takka}</div>
        <div class="table-cell piece">${pc}</div>
        <div class="table-cell mtr">${mtr}</div>
      </div>`;
  }).join('');

  // Add empty rows to fill up to 7 rows total
  const emptyRows = [];
  const totalRows = Math.max(7, (rows || []).length);
  for (let i = (rows || []).length; i < totalRows; i++) {
    emptyRows.push(`
      <div class="table-row">
        <div class="table-cell po-no"></div>
        <div class="table-cell design-no"></div>
        <div class="table-cell takka"></div>
        <div class="table-cell piece"></div>
        <div class="table-cell mtr"></div>
      </div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Challan</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .challan-container {
            background-color: white;
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid black;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .header {
            background-color: white;
            text-align: center;
            padding: 15px;
            border-bottom: 3px solid black;
            font-size: 18px;
            font-weight: bold;
        }
        
        .info-section {
            display: flex;
            border-bottom: 3px solid black;
        }
        
        .info-left, .info-right {
            flex: 1;
            padding: 40px 15px 15px 15px;
            display: flex;
            align-items: flex-end;
        }
        
        .info-item {
            margin-bottom: 0;
            margin-top: 40px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .client-section {
            display: flex;
            border-bottom: 3px solid black;
        }
        
        .client-left, .client-right {
            flex: 1;
            padding: 20px 15px;
        }
        
        .client-left {
            border-right: 1px solid black;
        }
        
        .client-left .info-item {
            margin-bottom: 20px;
            margin-top: 0;
        }
        
        .client-right .info-item {
            margin-bottom: 20px;
            margin-top: 0;
        }
        
        .table-section {
            border-bottom: 3px solid black;
        }
        
        .table-header {
            display: flex;
            background-color: white;
            border-bottom: 2px solid black;
        }
        
        .table-header div {
            padding: 15px 10px;
            font-weight: bold;
            text-align: center;
            border-right: 2px solid black;
            font-size: 14px;
        }
        
        .table-header div:last-child {
            border-right: none;
        }
        
        .po-no {
            flex: 1;
        }
        
        .design-no {
            flex: 1;
        }
        
        .takka {
            flex: 1;
        }
        
        .piece {
            flex: 1;
        }
        
        .mtr {
            flex: 1;
        }
        
        .table-body {
            min-height: 400px;
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .table-row {
            display: flex;
            min-height: 50px;
            flex: 1;
        }
        
        .table-cell {
            border-right: 2px solid black;
            padding: 10px;
        }
        
        .table-cell:last-child {
            border-right: none;
        }
        
        .total-row {
            display: flex;
            border-top: 2px solid black;
            background-color: #f9f9f9;
        }
        
        .total-row div {
            padding: 15px 10px;
            font-weight: bold;
            text-align: left;
            border-right: 2px solid black;
        }
        
        .total-row div:last-child {
            border-right: none;
        }
        
        .signature-section {
            display: flex;
            padding: 40px 15px;
            justify-content: space-between;
        }
        
        .signature-left {
            flex: 0 0 30%;
            font-weight: bold;
            font-size: 14px;
        }
        
        .signature-right {
            flex: 0 0 40%;
            font-weight: bold;
            font-size: 14px;
            text-align: left;
            margin-left: auto;
            padding-left: 60px;
        }
        
        /* Print styles */
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            
            .challan-container {
                box-shadow: none;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="challan-container">
        <!-- Header -->
        <div class="header">
            Delivery Challan
        </div>
        
        <!-- Info Section -->
        <div class="info-section">
            <div class="info-left">
                <div class="info-item">GST NO :</div>
            </div>
            <div class="info-right">
                <div class="info-item">Phone No :</div>
            </div>
        </div>
        
        <!-- Client Section -->
        <div class="client-section">
            <div class="client-left">
                <div class="info-item">Client Name : ${clientName}</div>
                <div class="info-item">Address :</div>
            </div>
            <div class="client-right">
                <div class="info-item">Challan No : ${challanNo}</div>
                <div class="info-item">Date : ${dateStr}</div>
            </div>
        </div>
        
        <!-- Table Section -->
        <div class="table-section">
            <!-- Table Header -->
            <div class="table-header">
                <div class="po-no">P.O No</div>
                <div class="design-no">Design No</div>
                <div class="takka">Takka</div>
                <div class="piece">Piece</div>
                <div class="mtr">Mtr</div>
            </div>
            
            <!-- Table Body -->
            <div class="table-body">
                ${tableRows}
                ${emptyRows.join('')}
            </div>
            
            <!-- Total Row -->
            <div class="total-row">
                <div class="po-no"></div>
                <div class="design-no"></div>
                <div class="takka">Total: ${totalTakka}</div>
                <div class="piece">Total: ${totalPiece}</div>
                <div class="mtr">Total: ${totalMtr}</div>
            </div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-left">Receiver Signature</div>
            <div class="signature-right">Signature</div>
        </div>
    </div>
</body>
</html>`;
  return html;
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


