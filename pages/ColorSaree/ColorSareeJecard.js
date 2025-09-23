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
import InsertDetailsModal from '../../components/InsertDetailsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ColorSareeJecard({ navigation, orderData }) {
  const [showInsert, setShowInsert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const data = orderData || {};
  const qty = data?.designQty ?? data?.quantity ?? (Array.isArray(data?.designQtys) ? data.designQtys[0] : '');
  const matchingJoined = (data?.matchingNo && String(data.matchingNo)) ||
    (Array.isArray(data?.matchingNos) ? data.matchingNos.join(',') : '');
  const blouseLabel = data?.blouseType === 'with' ? 'With blouse' : (data?.blouseType === 'without' ? 'Without blouse' : '-');

  // Local controls like the reference image
  const [blouseType, setBlouseType] = useState(data?.blouseType || 'with');
  const blouseLocked = true; // always locked when data comes from Party Order
  const inputsLocked = true; // always locked when data comes from Party Order
  const [pieceValue, setPieceValue] = useState(String(data?.piece || ''));
  const [meterValue, setMeterValue] = useState(String(data?.meter || ''));

  // Build a stable key for persistence (party|po|design)
  const buildPersistKey = (base) => {
    const party = String(base?.partyName || data.partyName || '-');
    const po = String(base?.poNo || data.poNo || '-');
    const design = String(base?.designNo || data.designNo || '-');
    return `jecard:${party}|${po}|${design}`;
  };

  // Load persisted values when screen mounts or when preview for a row opens
  useEffect(() => {
    const loadPersisted = async () => {
      try {
        const key = buildPersistKey(previewItem || data);
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!blouseLocked && parsed?.blouseType) setBlouseType(parsed.blouseType);
          if (!inputsLocked && parsed?.piece != null) setPieceValue(String(parsed.piece));
          if (!inputsLocked && parsed?.mtr != null) setMeterValue(String(parsed.mtr));
        }
      } catch (e) {
        // no-op
      }
    };
    loadPersisted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData, showPreview, previewItem]);

  useEffect(() => {
    if (pieceValue === '') { setMeterValue(''); return; }
    const n = Number(pieceValue);
    if (Number.isNaN(n)) { setMeterValue(''); return; }
    const factor = blouseType === 'with' ? 7 : 6;
    setMeterValue(String(n * factor));
  }, [pieceValue, blouseType]);

  // Persist changes whenever values change (and not locked by PartyOrder)
  useEffect(() => {
    const persist = async () => {
      try {
        const key = buildPersistKey(previewItem || data);
        const payload = { blouseType, piece: pieceValue, mtr: meterValue };
        await AsyncStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {
        // no-op
      }
    };
    // Save even if locked, so we keep the latest calculated mtr too
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blouseType, pieceValue, meterValue, previewItem]);

  const buildRows = () => {
    if (Array.isArray(data?.designNos) && data.designNos.length > 0) {
      const dnos = data.designNos;
      const dqtys = data.designQtys || [];
      const dmats = data.matchingNos || [];
      return dnos.map((dn, idx) => ({
        designNo: dn,
        designQty: dqtys[idx] || '',
        matchingNo: Array.isArray(dmats) ? String(dmats[idx] || '') : '',
        partyName: data.partyName,
        poNo: data.poNo,
        orderDate: data.orderDate,
        blouseType: data.blouseType,
        piece: data.piece,
        meter: data.meter,
      }));
    }
    return [{
      designNo: data.designNo,
      designQty: qty,
      matchingNo: matchingJoined,
      partyName: data.partyName,
      poNo: data.poNo,
      orderDate: data.orderDate,
      blouseType: data.blouseType,
      piece: data.piece,
      meter: data.meter,
    }];
  };
  const rows = buildRows();
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
          <Text style={styles.headerTitle}>Color Saree - JECARD</Text>
          {orderData && (
            <Text style={styles.headerSubtitle}>
              Design: {orderData.designNo} | Party: {orderData.partyName}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content: list + preview */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Design No</Text>
            <Text style={styles.headerCell}>Qty</Text>
            <Text style={styles.headerCell}>Matching No</Text>
          </View>
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={`row-${idx}`}
              style={styles.tableRow}
              activeOpacity={0.7}
              onPress={() => { setPreviewItem(row); setShowPreview(true); }}
            >
              <Text style={styles.cell}>{String(row.designNo || '-')}</Text>
              <Text style={styles.cell}>{String(row.designQty || '-')}</Text>
              <Text style={styles.cell} numberOfLines={1}>
                {String(row.matchingNo || '').split(',').filter(Boolean).map(s => s.trim()).join(', ') || '-'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Preview modal */}
      <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Jecard Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewCloseButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {!!previewItem && (
              <View style={styles.previewDetails}>
                <View style={styles.previewRow}><Text style={styles.previewLabel}>Party</Text><Text style={styles.previewValue}>{String(previewItem.partyName || data.partyName || '-')}</Text></View>
                <View style={styles.previewRow}><Text style={styles.previewLabel}>P.O. No</Text><Text style={styles.previewValue}>{String(previewItem.poNo || data.poNo || '-')}</Text></View>
                <View style={styles.previewRow}><Text style={styles.previewLabel}>P.O. Date</Text><Text style={styles.previewValue}>{String(previewItem.orderDate || data.orderDate || '-')}</Text></View>
                <View style={styles.detailTableContainer}>
                  <View style={styles.detailTableHeader}>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Design No</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 0.8 }]}>Qty</Text>
                    <Text style={[styles.detailHeaderCell, { flex: 1.2 }]}>Matching No</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={[styles.detailCell, { flex: 1.2 }]}>{String(previewItem.designNo || '-')}</Text>
                    <Text style={[styles.detailCell, { flex: 0.8 }]}>{String(previewItem.designQty || '-')}</Text>
                    <Text style={[styles.detailCell, { flex: 1.2 }]} numberOfLines={1}>
                      {String(previewItem.matchingNo || '').split(',').filter(Boolean).map(s => s.trim()).join(', ') || '-'}
                    </Text>
                  </View>
                </View>
                {/* Piece/Mtr controls like the reference UI */}
                <Text style={[styles.previewLabel, { marginBottom: 6 }]}>Piece/Mtr</Text>
                <View style={styles.splitHeaderRow}>
                  <TouchableOpacity
                    style={[
                      styles.tabPill,
                      blouseType === 'with' && styles.tabPillActive,
                      blouseLocked && styles.tabPillDisabled,
                    ]}
                    onPress={() => { if (!blouseLocked) setBlouseType('with'); }}
                    activeOpacity={0.9}
                  >
                    <Text style={[
                      styles.tabPillText,
                      blouseType === 'with' && styles.tabPillTextActive,
                      blouseLocked && styles.tabPillTextDisabled,
                    ]}>With blouse</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabPill,
                      blouseType === 'without' && styles.tabPillActive,
                      blouseLocked && styles.tabPillDisabled,
                    ]}
                    onPress={() => { if (!blouseLocked) setBlouseType('without'); }}
                    activeOpacity={0.9}
                  >
                    <Text style={[
                      styles.tabPillText,
                      blouseType === 'without' && styles.tabPillTextActive,
                      blouseLocked && styles.tabPillTextDisabled,
                    ]}>Without blouse</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.formRowTwoCols}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Piece</Text>
                    <TextInput
                      style={[styles.input, styles.inputReadonly]}
                      placeholder="0"
                      placeholderTextColor="#888"
                      keyboardType="numeric"
                      value={pieceValue}
                      onChangeText={() => {}}
                      editable={false}
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
              </View>
            )}
            {/* Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#3A3A3A', borderColor: '#555', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                onPress={() => setShowPreview(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FF6B35', borderColor: '#ff5722', borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
                onPress={() => {
                  // Directly send using the current values without any extra selection step
                  Alert.alert('Sent', `Blouse: ${blouseType === 'with' ? 'With blouse' : 'Without blouse'}\nPiece: ${pieceValue || '0'}\nMtr: ${meterValue || '0'}`);
                  setShowPreview(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Bottom Insert Button */}
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
  scrollContainer: {
    flex: 1,
  },
  processDetails: {
    paddingBottom: 20,
  },
  // Piece/Mtr controls (match PartyOrder visual language)
  splitHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
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
  tabPillDisabled: {
    opacity: 0.6,
  },
  tabPillTextDisabled: {
    color: '#888',
  },
  formRowTwoCols: {
    flexDirection: 'row',
    marginTop: 8,
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
  // Preview modal styles (reuse from PartyOrder for consistency)
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
  // Detail table inside preview
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
});
