import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
// Use legacy API to avoid deprecation runtime error in current Expo SDK
import * as FileSystem from 'expo-file-system/legacy';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { supabase } from './supabase';
import { decode as decodeBase64 } from 'base64-arraybuffer';

const { width, height } = Dimensions.get('window');

export default function DesignNoPage({ navigation }) {
  const listRef = useRef(null);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showImageActionSheet, setShowImageActionSheet] = useState(false);
  const [designNumber, setDesignNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [designList, setDesignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDesign, setEditingDesign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [duplicateError, setDuplicateError] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDesign, setViewDesign] = useState(null);

  // Live sync (AJAX-style) with Firestore - no manual reloads needed
  useEffect(() => {
    const designsCollection = collection(db, 'designs');
    const q = query(designsCollection, orderBy('dateAdded', 'desc'));
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const designs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDesignList(designs);
      setFilteredDesigns((prev) => {
        // If there is an active search, re-filter on new data
        if (!searchQuery || searchQuery.trim() === '') return designs;
        const normalized = searchQuery.trim().toLowerCase();
        return designs.filter(item => (item.designNumber || '').toString().toLowerCase().includes(normalized));
      });
      setLoading(false);
    }, (error) => {
      console.error('Error loading designs:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query || query.trim() === '') {
      setFilteredDesigns(designList);
      return;
    }
    const normalized = query.trim().toLowerCase();
    const results = designList.filter(item =>
      (item.designNumber || '').toString().toLowerCase().includes(normalized)
    );
    setFilteredDesigns(results);
  };

  const saveDesignToDatabase = async (designData) => {
    try {
      const designsCollection = collection(db, 'designs');
      const docRef = await addDoc(designsCollection, designData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  };

  const updateDesignInDatabase = async (designId, designData) => {
    try {
      const designDoc = doc(db, 'designs', designId);
      await updateDoc(designDoc, designData);
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  };

  const deleteDesignFromDatabase = async (designId) => {
    try {
      const designDoc = doc(db, 'designs', designId);
      await deleteDoc(designDoc);
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  };

// Supabase Storage configuration
const SUPABASE_BUCKET = 'design-img';

const getFileExtensionFromUri = (uri) => {
  try {
    const path = uri.split('?')[0];
    const parts = path.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
    return ext || 'jpg';
  } catch (e) {
    return 'jpg';
  }
};

const isLocalUri = (uri) => {
  return typeof uri === 'string' && (uri.startsWith('file:') || uri.startsWith('content:'));
};

// Upload image to Supabase and return public URL
const uploadImageToSupabase = async (localUri) => {
  const extension = getFileExtensionFromUri(localUri);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = `design-images/${fileName}`;

  let uploadBody;
  let contentType = `image/${extension}`;
  try {
    if (localUri.startsWith('file:')) {
      const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
      uploadBody = decodeBase64(base64);
    } else if (localUri.startsWith('content:')) {
      const cachePath = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: localUri, to: cachePath });
      const base64 = await FileSystem.readAsStringAsync(cachePath, { encoding: 'base64' });
      uploadBody = decodeBase64(base64);
    } else {
      const res = await fetch(localUri);
      const ab = await res.arrayBuffer();
      uploadBody = ab;
      const ct = res.headers?.get?.('content-type');
      if (ct) contentType = ct;
    }
  } catch (readErr) {
    console.error('File read error:', readErr);
    throw readErr;
  }

  const { error: uploadError } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, uploadBody, { contentType, upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

  const handleInsertClick = () => {
    setEditingDesign(null);
    setDesignNumber('');
    setSelectedImage(null);
    setDuplicateError('');
    setShowInsertModal(true);
  };
  const closeInsertModal = () => {
    setShowInsertModal(false);
    setDuplicateError('');
    setDesignNumber('');
    setSelectedImage(null);
    setEditingDesign(null);
  };


  const handleSelectImage = () => {
    setShowImageActionSheet(true);
  };

  const handleActionSheetOption = (option) => {
    setShowImageActionSheet(false);
    if (option === 'takePhoto') {
      handleTakePhoto();
    } else if (option === 'chooseFromLibrary') {
      handleChooseFromLibrary();
    }
  };

  const formatDateDDMMYYYY = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const handleViewDesign = (design) => {
    setViewDesign(design);
    setShowViewModal(true);
  };

  const handleEditDesign = (design) => {
    setEditingDesign(design);
    setDesignNumber(design.designNumber);
    setDuplicateError('');
    setSelectedImage(design.image);
    setShowInsertModal(true);
  };

  const handleDeleteDesign = (designId) => {
    Alert.alert(
      'Delete Design',
      'Are you sure you want to delete this design?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDesignFromDatabase(designId);
              Alert.alert('Success', 'Design deleted successfully!');
            } catch (error) {
              console.error('Error deleting design:', error);
              Alert.alert('Error', 'Failed to delete design. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleInsertDesign = async () => {
    if (!designNumber.trim()) {
      Alert.alert('Error', 'Please enter design number');
      return;
    }
    // Client-side duplicate check using live list
    const normalized = designNumber.trim().toLowerCase();
    const exists = designList.some(d => (d.designNumber || '').toString().toLowerCase() === normalized && (!editingDesign || d.id !== editingDesign.id));
    if (exists) {
      setDuplicateError('Design number already exists');
      Alert.alert('Duplicate', 'This design number already exists. Please use a different number.');
      return;
    }

    try {
      setLoading(true);
      // Server-side duplicate check to prevent race conditions
      try {
        const dupQ = query(collection(db, 'designs'), where('designNumber', '==', designNumber.trim()));
        const dupSnap = await getDocs(dupQ);
        if (editingDesign) {
          const other = dupSnap.docs.find(d => d.id !== editingDesign.id);
          if (other) {
            setLoading(false);
            Alert.alert('Duplicate', 'This design number already exists. Please use a different number.');
            return;
          }
        } else if (!dupSnap.empty) {
          setLoading(false);
          Alert.alert('Duplicate', 'This design number already exists. Please use a different number.');
          return;
        }
      } catch (dupErr) {
        console.error('Duplicate check failed:', dupErr);
      }

      // Upload local image to Supabase so others can see it
      let imageUrl = null;
      if (selectedImage) {
        if (isLocalUri(selectedImage)) {
          try {
            imageUrl = await uploadImageToSupabase(selectedImage);
          } catch (e) {
            console.error('Upload failed:', e);
            Alert.alert('Image Upload Failed', 'Could not upload image. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          imageUrl = selectedImage; // already a URL
        }
      }

      // Create new design object storing local URI (image is optional)
      const designData = {
        designNumber: designNumber.trim(),
        image: imageUrl,
        dateAdded: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (editingDesign) {
        // Update existing design
        await updateDesignInDatabase(editingDesign.id, designData);
        Alert.alert('Success', 'Design updated successfully!');
      } else {
        // Add new design
        await saveDesignToDatabase(designData);
        Alert.alert('Success', 'Design added successfully!');
      }
      
      setShowInsertModal(false);
      setDesignNumber('');
      setSelectedImage(null);
      setEditingDesign(null);
      // Scroll to top to reveal the newest item (ordered by dateAdded desc)
      setTimeout(() => {
        try {
          listRef.current?.scrollTo({ y: 0, animated: true });
        } catch {}
      }, 150);
    } catch (error) {
      console.error('Error saving design:', error);
      Alert.alert('Error', 'Failed to save design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Design No</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentCard}>
          {/* Design Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading designs...</Text>
            </View>
          ) : designList.length > 0 ? (
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              ref={listRef}
            >
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Icon name="search-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search design no..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                </View>
              </View>

              <View style={styles.designGridContainer}>
                {filteredDesigns.length > 0 ? (
                  filteredDesigns.map((design) => (
                    <View key={design.id} style={styles.designCard}>
                      <View style={styles.cardImageContainer}>
                        {design.image ? (
                          <Image source={{ uri: design.image }} style={styles.cardImage} />
                        ) : (
                          <View style={styles.noImageContainer}>
                            <Icon name="image-outline" size={32} color="#999" />
                            <Text style={styles.noImageText}>No Image</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardDesignNumber}>{design.designNumber}</Text>
                      <View style={styles.cardButtons}>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => handleViewDesign(design)}
                        >
                          <Icon name="eye" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => handleEditDesign(design)}
                        >
                          <Icon name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteDesign(design.id)}
                        >
                          <Icon name="trash" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="images-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyStateText}>No designs found</Text>
                    <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="images-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No designs added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add your first design</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Navigation Bar - Only Insert Button */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.insertButton} onPress={handleInsertClick}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Insert Modal */}
      <Modal
        visible={showInsertModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeInsertModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDesign ? 'Edit Design' : 'Insert New Design'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeInsertModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Design No:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter design number"
                  value={designNumber}
                  onChangeText={(v) => {
                    setDesignNumber(v);
                    const n = v.trim().toLowerCase();
                    if (!n) { setDuplicateError(''); return; }
                    const ex = designList.some(d => (d.designNumber || '').toString().toLowerCase() === n && (!editingDesign || d.id !== editingDesign.id));
                    setDuplicateError(ex ? 'Design number already exists' : '');
                  }}
                  placeholderTextColor="#999"
                />
                {!!duplicateError && (
                  <Text style={styles.errorText}>{duplicateError}</Text>
                )}
                
                <Text style={styles.fieldLabel}>Select Image:</Text>
                <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
                  <Icon name="camera" size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>
                    {selectedImage ? 'Change Image' : 'Select Image'}
                  </Text>
                </TouchableOpacity>
                
                {selectedImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  </View>
                )}
              </View>
              
              <TouchableOpacity style={styles.insertDesignButton} onPress={handleInsertDesign}>
                <Text style={styles.insertDesignButtonText}>
                  {editingDesign ? 'Update Design' : 'Add Design'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Image Action Sheet Modal */}
      <Modal
        visible={showImageActionSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImageActionSheet(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetContainer}>
            <TouchableOpacity 
              style={styles.actionSheetOption}
              onPress={() => handleActionSheetOption('takePhoto')}
            >
              <Text style={styles.actionSheetOptionText}>TAKE PHOTO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionSheetOption}
              onPress={() => handleActionSheetOption('chooseFromLibrary')}
            >
              <Text style={styles.actionSheetOptionText}>CHOOSE FROM LIBRARY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionSheetCancelOption}
              onPress={() => setShowImageActionSheet(false)}
            >
              <Text style={styles.actionSheetOptionText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Design Modal */}
      <Modal
        visible={showViewModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.viewOverlay}>
          <View style={styles.viewCard}>
            <View style={styles.viewHeaderRow}>
              <Text style={styles.viewHeaderTitle}>Design Preview</Text>
              <TouchableOpacity style={styles.viewClose} onPress={() => setShowViewModal(false)}>
                <Text style={styles.viewCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.viewImageContainer}>
              {viewDesign?.image ? (
                <Image source={{ uri: viewDesign.image }} style={styles.viewImage} />
              ) : (
                <View style={styles.noImageContainer}>
                  <Icon name="image-outline" size={48} color="#999" />
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
            </View>

            <View style={styles.viewMetaBox}>
              <View style={styles.metaRow}>
                <Icon name="pricetag" size={16} color="#9EC8FF" />
                <Text style={styles.viewMetaLabel}>Design No</Text>
                <Text style={styles.viewMetaValue}>{viewDesign?.designNumber || '-'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <Icon name="calendar" size={16} color="#9EC8FF" />
                <Text style={styles.viewMetaLabel}>Added</Text>
                <Text style={styles.viewMetaValue}>{formatDateDDMMYYYY(viewDesign?.dateAdded)}</Text>
              </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    paddingTop: 10,
  },
  contentCard: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#555555',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 50,
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
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    width: width * 0.8,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 10,
  },
  insertDesignButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  insertDesignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#3A3A3A',
    color: '#FFFFFF',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00BFFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 15,
    backgroundColor: '#1A1A1A',
  },
  imageButtonText: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 15,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    width: '100%',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  actionSheetOption: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  actionSheetCancelOption: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionSheetOptionText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#00BFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  actionSheetSeparator: {
    height: 0,
    backgroundColor: 'transparent',
  },
  viewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#555555',
  },
  viewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewClose: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  viewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  viewSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  viewMetaBox: {
    backgroundColor: '#222',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b4b4b',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  viewMetaLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  viewMetaValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 4,
    opacity: 0.7,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  designGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  designCard: {
    width: (width - 60) / 2, // 2 columns with margins
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#555555',
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  cardDesignNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#6c757d',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 15,
  },
});
