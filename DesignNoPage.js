import React, { useState, useEffect } from 'react';
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
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function DesignNoPage({ navigation }) {
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showImageActionSheet, setShowImageActionSheet] = useState(false);
  const [designNumber, setDesignNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [designList, setDesignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDesign, setEditingDesign] = useState(null);

  // Load designs from database on component mount
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const designsCollection = collection(db, 'designs');
      const q = query(designsCollection, orderBy('dateAdded', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const designs = [];
      querySnapshot.forEach((doc) => {
        designs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setDesignList(designs);
    } catch (error) {
      console.error('Error loading designs:', error);
      Alert.alert('Error', 'Failed to load designs');
    } finally {
      setLoading(false);
    }
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

  const handleInsertClick = () => {
    setEditingDesign(null);
    setDesignNumber('');
    setSelectedImage(null);
    setShowInsertModal(true);
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

  const handleViewDesign = (design) => {
    Alert.alert('View Design', `Design Number: ${design.designNumber}\nAdded: ${design.dateAdded}`);
  };

  const handleEditDesign = (design) => {
    setEditingDesign(design);
    setDesignNumber(design.designNumber);
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
              setDesignList(prevList => prevList.filter(item => item.id !== designId));
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

    try {
      // Create new design object (image is optional)
      const designData = {
        designNumber: designNumber.trim(),
        image: selectedImage || null, // Allow null if no image selected
        dateAdded: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (editingDesign) {
        // Update existing design
        await updateDesignInDatabase(editingDesign.id, designData);
        setDesignList(prevList => 
          prevList.map(item => 
            item.id === editingDesign.id 
              ? { ...item, ...designData }
              : item
          )
        );
        Alert.alert('Success', 'Design updated successfully!');
      } else {
        // Add new design
        const docId = await saveDesignToDatabase(designData);
        const newDesign = {
          id: docId,
          ...designData,
          dateAdded: new Date(designData.dateAdded).toLocaleDateString(),
        };
        setDesignList(prevList => [newDesign, ...prevList]);
        Alert.alert('Success', 'Design added successfully!');
      }
      
      setShowInsertModal(false);
      setDesignNumber('');
      setSelectedImage(null);
      setEditingDesign(null);
    } catch (error) {
      console.error('Error saving design:', error);
      Alert.alert('Error', 'Failed to save design. Please try again.');
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
            >
              <View style={styles.designGridContainer}>
                {designList.map((design) => (
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
                ))}
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
        onRequestClose={() => setShowInsertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDesign ? 'Edit Design' : 'Insert New Design'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowInsertModal(false)}
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
                  onChangeText={setDesignNumber}
                  placeholderTextColor="#999"
                />
                
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
