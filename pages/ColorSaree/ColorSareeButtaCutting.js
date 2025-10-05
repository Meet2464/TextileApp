import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import jecardFirebaseUtils from '../../utils/firebaseJecard';

export default function ColorSareeButtaCutting({ navigation }) {
  const { userData } = useUser();
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showChallan, setShowChallan] = useState(false);
  const [selectedIds, setSelectedIds] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [clientName, setClientName] = useState('');
  const [chalanNo, setChalanNo] = useState('');
  const [pieceVal, setPieceVal] = useState('');
  const [mtrVal, setMtrVal] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
        const data = await jecardFirebaseUtils.loadButtaColorRows(tenantId);
        setRows(data);
      } catch {
        setRows([]);
      }
    })();
  }, [userData]);

  const pendingRows = rows.filter(r => !r.sentToBleach);
  const doneRows = rows.filter(r => r.sentToBleach);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Color Saree - Butta Cutting</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>P.O.NO</Text>
            <Text style={styles.headerCell}>CLIENT NAME</Text>
            <Text style={styles.headerCell}>CHALAN NO</Text>
            <Text style={styles.headerCell}>{activeTab === 'pending' ? 'SEND' : 'STATUS'}</Text>
          </View>
          {(activeTab === 'pending' ? pendingRows : doneRows).map((r, idx) => (
            <TouchableOpacity 
              key={`row-${idx}`} 
              style={styles.tableRow}
              activeOpacity={0.7}
            >
              <Text style={styles.cell}>{String(r.poNo)}</Text>
              <Text style={styles.cell}>{String(r.clientName || r.partyName || '-')}</Text>
              <Text style={styles.cell}>{String(r.chalanNo || '-')}</Text>
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

        {/* Preview Modal */}
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
                <Text style={styles.previewBodyCell}>{String(selectedRow.partyName || selectedRow.clientName || '-')}</Text>
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

                    // Enrich the row with user input
                    const enriched = { ...selectedRow, clientName, chalanNo, piece: pieceVal, mtr: mtrVal, sentToBleach: true };

                    // Update butta rows - mark as sent
                    const updatedRows = rows.map(r => 
                      (r.poNo === selectedRow.poNo && r.designNo === selectedRow.designNo) 
                        ? enriched 
                        : r
                    );
                    await jecardFirebaseUtils.saveButtaColorRows(updatedRows, tenantId);

                    // Add to Bleach workflow
                    const bleachData = await jecardFirebaseUtils.loadBleachColorRows(tenantId);
                    const newBleachRow = {
                      poNo: enriched.poNo,
                      clientName: enriched.clientName || enriched.partyName || '',
                      chalanNo: enriched.chalanNo || '',
                      designNo: enriched.designNo || '',
                      piece: enriched.piece || '',
                      mtr: enriched.mtr || '',
                    };
                    await jecardFirebaseUtils.saveBleachColorRows([...bleachData, newBleachRow], tenantId);

                    setRows(updatedRows);
                    setShowPreview(false);
                    setSelectedRow(null);
                    setActiveTab('done');
                    navigation?.navigate?.('ColorSareeBleach');
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
                {doneRows.filter(r => !r.pdfDownloaded).length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>
                      {doneRows.length === 0 
                        ? 'No items in done data yet.\nSend items from pending data first.' 
                        : 'All items have been downloaded.\nNo new items available.'}
                    </Text>
                  </View>
                ) : (
                  doneRows.filter(r => !r.pdfDownloaded).map((r, idx) => {
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
              const availableRows = doneRows.filter(r => !r.pdfDownloaded);
              const picked = availableRows.filter((r, idx) => selectedIds[`${r.poNo}-${r.designNo}-${idx}`]);
              
              if (picked.length === 0) {
                Alert.alert('No Selection', 'Please select at least one item to download.');
                return;
              }
              
              try {
                const tenantId = userData?.companyId || userData?.company?.id || userData?.companyName || 'default';
                const html = buildChallanHtml(picked);
                
                // Get next Bleach counter
                const bleachCounterRef = await AsyncStorage.getItem('bleach_challan_counter_color');
                const nextNo = bleachCounterRef ? parseInt(bleachCounterRef) + 1 : 1;
                await AsyncStorage.setItem('bleach_challan_counter_color', String(nextNo));
                
                const filename = `C Bleach - ${String(nextNo)}.pdf`;
                const savedPath = await savePdfToDownloads(html, filename);
                
                // Mark selected rows as PDF downloaded
                const selectedPoDesigns = picked.map(p => `${p.poNo}-${p.designNo}`);
                const updatedRows = rows.map((r) => {
                  const rowKey = `${r.poNo}-${r.designNo}`;
                  if (selectedPoDesigns.includes(rowKey)) {
                    return { ...r, pdfDownloaded: true };
                  }
                  return r;
                });
                
                await jecardFirebaseUtils.saveButtaColorRows(updatedRows, tenantId);
                setRows(updatedRows);
                
                Alert.alert('Download complete', `PDF saved as ${filename}`);
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

async function savePdfToDownloads(html, filename) {
  const finalFilename = filename || `DeliveryChallan-${Date.now()}.pdf`;
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          finalFilename,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        return fileUri;
      }
    } catch (e) {}
  }
  const dest = FileSystem.documentDirectory + finalFilename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

function buildChallanHtml(rows) {
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

  let totalPiece = 0;
  let totalMtr = 0;
  let totalTakka = 0;

  const dataRows = (rows || []).map((r) => {
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

  const emptyRows = [];
  const totalRows = 7;
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .challan-container { background-color: white; width: 125mm; height: 170mm; margin: 0 auto; border: 3px solid black; box-shadow: 0 4px 8px rgba(0,0,0,0.1); box-sizing: border-box; display: flex; flex-direction: column; }
        .header { background-color: white; text-align: center; padding: 0; height: 0.6cm; border-bottom: 3px solid black; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .info-section { display: flex; border-bottom: 3px solid black; height: 1in; }
        .info-left, .info-right { flex: 1; padding: 10px; display: flex; align-items: flex-end; }
        .info-item { margin-bottom: 0; margin-top: 0; font-size: 12px; font-weight: bold; }
        .client-section { display: flex; border-bottom: 3px solid black; height: 1in; }
        .client-left, .client-right { flex: 1; padding: 10px; }
        .client-left { border-right: 1px solid black; }
        .client-left .info-item { margin-bottom: 8px; margin-top: 0; font-size: 12px; }
        .client-right .info-item { margin-bottom: 8px; margin-top: 0; font-size: 12px; }
        .table-section { height: 3.3in; display: flex; flex-direction: column; border-bottom: 2px solid black; }
        .table-header { display: flex; background-color: white; border-bottom: 2px solid black; }
        .table-header div { padding: 8px 6px; font-weight: bold; text-align: center; border-right: 2px solid black; font-size: 12px; }
        .table-header div:last-child { border-right: none; }
        .po-no { flex: 1; }
        .design-no { flex: 1; }
        .takka { flex: 1; }
        .piece { flex: 1; }
        .mtr { flex: 1; }
        .table-body { flex: 1; display: flex; flex-direction: column; }
        .table-row { display: flex; min-height: 45px; flex: 1; }
        .table-cell { border-right: 2px solid black; padding: 5px; font-size: 11px; display: flex; align-items: center; justify-content: center; }
        .table-row:last-child .table-cell { border-bottom: 2px solid black; }
        .total-row { display: flex; background-color: white; height: 0.2in; }
        .total-row div { padding: 1px 6px; font-weight: bold; text-align: center; border-right: 1px solid black; font-size: 10px; display: flex; align-items: center; justify-content: center; }
        .total-row div:last-child { border-right: none; }
        .signature-section { display: flex; padding: 10px 10px 10px 15px; justify-content: space-between; align-items: center; height: 0.8in; flex: 1; }
        .signature-left { flex: 0 0 30%; font-weight: bold; font-size: 12px; border-right: 2px solid black; padding-right: 10px; padding-left: 10px; }
        .signature-right { flex: 0 0 40%; font-weight: bold; font-size: 12px; text-align: left; margin-left: auto; padding-left: 50px; }
        @media print { body { background-color: white; padding: 0; } .challan-container { box-shadow: none; max-width: none; } }
    </style>
</head>
<body>
    <div class="challan-container">
        <div class="header">Delivery Challan</div>
        <div class="info-section">
            <div class="info-left"><div class="info-item">GST NO :</div></div>
            <div class="info-right"><div class="info-item">Phone No :</div></div>
        </div>
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
        <div class="table-section">
            <div class="table-header">
                <div class="po-no">P.O No</div>
                <div class="design-no">Design No</div>
                <div class="takka">Takka</div>
                <div class="piece">Piece</div>
                <div class="mtr">Mtr</div>
            </div>
            <div class="table-body">
${dataRows}${emptyRows.join('')}
            </div>
        </div>
        <div class="total-row">
            <div class="po-no"></div>
            <div class="design-no"></div>
            <div class="takka">${totalTakka}</div>
            <div class="piece">${totalPiece}</div>
            <div class="mtr">${totalMtr}</div>
        </div>
        <div class="signature-section">
            <div class="signature-left">Reciever Signature</div>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#2A2A2A',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  inputLabel: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#00BFFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#00BFFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  downloadBtn: {
    backgroundColor: '#00FFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7FFFD4',
  },
  downloadText: {
    color: '#003344',
    fontSize: 16,
    fontWeight: '900',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewBox: {
    backgroundColor: '#2A2A2A',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  previewTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#00BFFF',
    textAlign: 'center',
  },
  previewTableRow: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewBodyCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#555555',
  },
});


