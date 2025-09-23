import React, { useState, useEffect } from 'react';
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
import ColorSareeJecard from './ColorSareeJecard';

const { width } = Dimensions.get('window');

const getRowKey = (row) => {
  const raw = row?._raw || row || {};
  const party = raw.partyName || row?.partyName || '';
  const po = raw.poNo || row?.poNo || '';
  const design = raw.designNo || row?.designNo || '';
  return `${party}|${po}|${design}`;
};

export default function ColorSareePartyOrder({ navigation, orderData, orderDataList }) {
  const [showInsert, setShowInsert] = useState(false);
  const [name, setName] = useState('');
  const [chalanNo, setChalanNo] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [blouseType, setBlouseType] = useState('with'); // 'with' or 'without'
  const [pieceValue, setPieceValue] = useState('');
  const [meterValue, setMeterValue] = useState('');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [showJecard, setShowJecard] = useState(false);
  const [jecardData, setJecardData] = useState(null);
  const [isCleared, setIsCleared] = useState(false);

  // Auto-calc meters when piece or blouse type changes
  useEffect(() => {
    if (pieceValue === '') {
      setMeterValue('');
      return;
    }
    const numPieces = Number(pieceValue);
    if (Number.isNaN(numPieces)) {
      setMeterValue('');
      return;
    }
    const factor = blouseType === 'with' ? 7 : 6;
    const meters = numPieces * factor;
    setMeterValue(String(meters));
  }, [pieceValue, blouseType]);
  const normalizeRow = (row) => {
    const designQty = row?.designQty ?? row?.quantity ?? row?.qty ?? '';
    let matchingNo = row?.matchingNo ?? '';
    if (!matchingNo && Array.isArray(row?.matchingNos)) {
      matchingNo = row.matchingNos.join(',');
    }
    return {
      partyName: row?.partyName ?? '',
      poNo: row?.poNo ?? '',
      orderDate: row?.orderDate ?? '',
      designNo: row?.designNo ?? '',
      designQty: designQty,
      matchingNo: matchingNo,
      _raw: row,
      _key: getRowKey({ _raw: row, partyName: row?.partyName, poNo: row?.poNo, designNo: row?.designNo }),
    };
  };

  const buildRows = () => {
    if (Array.isArray(orderDataList) && orderDataList.length > 0) {
      return orderDataList.map(normalizeRow);
    }
    if (orderData) {
      // If arrays are present, split them into separate rows so Qty/Matching align
      const hasArrays = Array.isArray(orderData.designNos) && orderData.designNos.length > 0;
      if (hasArrays) {
        const dnos = orderData.designNos || [];
        const dqtys = orderData.designQtys || [];
        const dmats = orderData.matchingNos || [];
        return dnos.map((dn, idx) => normalizeRow({
          partyName: orderData.partyName,
          poNo: orderData.poNo,
          orderDate: orderData.orderDate,
          designNo: dn,
          designQty: dqtys[idx],
          matchingNo: Array.isArray(dmats) ? String(dmats[idx] || '') : '',
        }));
      }
      // Fallback single row
      return [normalizeRow({
        partyName: orderData.partyName,
        poNo: orderData.poNo,
        orderDate: orderData.orderDate,
        designNo: orderData.designNo,
        designQty: orderData.quantity,
        matchingNo: Array.isArray(orderData.matchingNos) ? orderData.matchingNos.join(',') : '',
      })];
    }
    return [];
  };

  const [rows, setRows] = useState(buildRows());

  useEffect(() => {
    setRows(buildRows());
  }, [orderDataList, orderData]);

  // Navigate to Jecard screen with payload
  if (showJecard) {
    return (
      <ColorSareeJecard
        navigation={{
          goBack: () => {
            // Stay on Jecard until user goes back; when they do, keep Party Order cleared
            setShowJecard(false);
          }
        }}
        orderData={jecardData}
      />
    );
  }
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
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>P.O. NO</Text>
            <Text style={styles.headerCell}>PARTY NAME</Text>
            <Text style={styles.headerCell}>P.O. DATE</Text>
          </View>
          {/* Rows */}
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={`row-${idx}`}
              style={styles.tableRow}
              activeOpacity={0.7}
              onPress={() => { setPreviewItem(row); setPreviewIndex(idx); setShowPreview(true); }}
            >
              <Text style={styles.cell}>{String(row.poNo ?? '-')}</Text>
              <Text style={styles.cell}>{String(row.partyName ?? '-')}</Text>
              <Text style={styles.cell}>{String(row.orderDate ?? '-')}</Text>
            </TouchableOpacity>
          ))}
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

      {/* Preview Modal for a selected row */}
      <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Party Order Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewCloseButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {previewItem && (
              <View style={styles.previewDetails}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>P.O. No</Text>
                  <Text style={styles.previewValue}>{previewItem.poNo}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>P.O. Date</Text>
                  <Text style={styles.previewValue}>{previewItem.orderDate}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Party</Text>
                  <Text style={styles.previewValue}>{previewItem.partyName}</Text>
                </View>

                {/* Line Items Table - Design No, Qty, Matching No */}
                <View style={styles.detailTableContainer}>
                  <View style={styles.detailTableHeader}>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Design No</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 0.8 }]}>Qty</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Matching No</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={[styles.detailCell, { flex: 1.2 }]}>{String(previewItem.designNo || '-')}</Text>
                    <Text style={[styles.detailCell, { flex: 0.8 }]}>{String(previewItem.designQty ?? previewItem.quantity ?? '-')}</Text>
                    <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                      {String(previewItem.matchingNo || '')
                        .split(',')
                        .filter(Boolean).length > 0 ? (
                        <View style={styles.matchListRow}>
                          {String(previewItem.matchingNo || '')
                            .split(',')
                            .filter(Boolean)
                            .map((code) => (
                              <View key={code} style={styles.matchPill}>
                                <Text style={styles.matchPillText}>{code.trim()}</Text>
                              </View>
                            ))}
                        </View>
                      ) : (
                        <Text style={styles.detailCell}>-</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Actions at bottom of preview */}
            <View style={styles.previewActionsRow}>
              <TouchableOpacity
                style={styles.previewDeleteButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (previewIndex == null) return;
                  Alert.alert('Delete', 'Delete this item?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { 
                        setRows(prev => prev.filter((_, i) => i !== previewIndex));
                        setShowPreview(false);
                        setPreviewIndex(null);
                      } 
                    }
                  ]);
                }}
              >
                <Text style={styles.previewDeleteText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 }]}
                activeOpacity={0.8}
                onPress={() => setShowSendPopup(true)}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send popup container (from preview -> Send) */}
      <Modal visible={showSendPopup} transparent animationType="fade" onRequestClose={() => setShowSendPopup(false)}>
        <View style={styles.sendPopupOverlay}>
          <View style={styles.sendPopupCard}>
            {/* Section label */}
            <Text style={styles.sectionLabel}>Piece/Mtr</Text>
            {/* Top split selector - pill tabs */}
            <View style={styles.splitHeaderRow}>
              <TouchableOpacity
                style={[styles.tabPill, blouseType === 'with' && styles.tabPillActive]}
                onPress={() => setBlouseType('with')}
                activeOpacity={0.9}
              >
                <Text style={[styles.tabPillText, blouseType === 'with' && styles.tabPillTextActive]}>With blouse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabPill, blouseType === 'without' && styles.tabPillActive]}
                onPress={() => setBlouseType('without')}
                activeOpacity={0.9}
              >
                <Text style={[styles.tabPillText, blouseType === 'without' && styles.tabPillTextActive]}>Without blouse</Text>
              </TouchableOpacity>
            </View>

            {/* Large split area */}
            <View style={styles.formRowTwoCols}>
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>Piece</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={pieceValue}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9]/g, '');
                    setPieceValue(cleaned);
                  }}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>Mtr</Text>
                <TextInput
                  style={[styles.input, styles.inputReadonly]}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  value={meterValue}
                  onChangeText={() => {}}
                  editable={false}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sendPopupActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSendPopup(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }]}
                onPress={() => {
                  // Build payload for Jecard using currently previewed item and blouse calc
                  const base = previewItem || {};
                  const payload = {
                    ...base,
                    partyName: base.partyName,
                    poNo: base.poNo,
                    orderDate: base.orderDate,
                    designNo: base.designNo,
                    designQty: base.designQty,
                    matchingNo: base.matchingNo,
                    blouseType,
                    piece: pieceValue,
                    meter: meterValue,
                  };
                  setShowSendPopup(false);
                  setShowPreview(false);
                  // Do not clear Party Order list anymore
                  // Navigate to Jecard
                  setJecardData(payload);
                  setShowJecard(true);
                }}
              >
                <Text style={styles.sendButtonText}>Send</Text>
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#555555',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
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
  // Detail table styles for preview
  detailTableContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailHeaderCell: {
    color: '#00BFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  detailTableRow: {
    flexDirection: 'row',
    backgroundColor: '#2F2F2F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3b3b3b',
  },
  detailCell: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  matchListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  matchPill: {
    backgroundColor: '#0b2533',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  matchPillText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  // Send popup styles
  sendPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sendPopupCard: {
    width: '90%',
    backgroundColor: '#2F2F2F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#555555',
    overflow: 'hidden',
    padding: 16,
    alignSelf: 'center',
  },
  splitHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabPillText: {
    color: '#bbb',
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginBottom: 6,
  },
  formRowTwoCols: {
    flexDirection: 'row',
    marginTop: 10,
  },
  formCol: {
    flex: 1,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3a5a40',
    backgroundColor: '#1f2d2a',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputReadonly: {
    backgroundColor: '#1f2933',
    borderColor: '#334e68',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#444',
  },
  verticalDividerThick: {
    width: 2,
    backgroundColor: '#444',
  },
  splitBody: {
    flexDirection: 'row',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    overflow: 'hidden',
  },
  splitBodyColumn: {
    flex: 1,
    padding: 0,
    alignItems: 'stretch',
  },
  splitTopStrip: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    backgroundColor: '#2A2A2A',
  },
  splitTopStripText: {
    color: '#bbb',
    fontWeight: '700',
  },
  splitBottomArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  splitBodyInput: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#fff',
    backgroundColor: '#2A2A2A',
    textAlign: 'center',
  },
  sendPopupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#3A3A3A',
    borderColor: '#555',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Preview modal styles (match OrderNoPage for consistency)
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#2A2A2A',
    width: width * 0.9,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#555555',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewCloseButton: {
    padding: 4,
  },
  previewDetails: {
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  previewDeleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  previewDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
