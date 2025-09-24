import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// Removed page imports (Color/White/Garment) per request

const { width, height } = Dimensions.get('window');

export default function SelectSaree({ navigation, orderData, allowedType }) {
  // If allowedType is provided, lock the page to that category
  const [selectedSareeType, setSelectedSareeType] = useState(allowedType || 'color');
  const [showColorJecard, setShowColorJecard] = useState(false);
  const [showColorButtaCutting, setShowColorButtaCutting] = useState(false);
  const [showColorBleach, setShowColorBleach] = useState(false);
  const [showColorCotting, setShowColorCotting] = useState(false);
  const [showColorPositionPrint, setShowColorPositionPrint] = useState(false);
  const [showColorFinish, setShowColorFinish] = useState(false);
  const [showColorChecking, setShowColorChecking] = useState(false);
  const [showColorDelivery, setShowColorDelivery] = useState(false);
  const [showWhiteJecard, setShowWhiteJecard] = useState(false);
  const [showWhiteButtaCutting, setShowWhiteButtaCutting] = useState(false);
  const [showWhiteBleach, setShowWhiteBleach] = useState(false);
  const [showWhiteFinish, setShowWhiteFinish] = useState(false);
  const [showWhiteDelivery, setShowWhiteDelivery] = useState(false);
  const [showGarmentEmbroidery, setShowGarmentEmbroidery] = useState(false);
  const [showGarmentButtaCutting, setShowGarmentButtaCutting] = useState(false);
  const [showGarmentBleach, setShowGarmentBleach] = useState(false);
  const [showGarmentCotting, setShowGarmentCotting] = useState(false);
  const [showGarmentPositionPrint, setShowGarmentPositionPrint] = useState(false);
  const [showGarmentFinish, setShowGarmentFinish] = useState(false);
  const [showGarmentChecking, setShowGarmentChecking] = useState(false);
  const [showGarmentDelivery, setShowGarmentDelivery] = useState(false);

  const handleBack = () => {
    navigation?.goBack();
  };

  const handleSareeTypeSelect = (type) => {
    if (allowedType && type !== allowedType) return;
    setSelectedSareeType(type);
  };

  const shouldShowButton = (type) => !allowedType || allowedType === type;

  const handleProcessSelect = (process) => {
    if (selectedSareeType === 'color') {
      switch (process.id) {
        case 'jecard':
          setShowColorJecard(true);
          break;
        case 'butta-cutting':
          setShowColorButtaCutting(true);
          break;
        case 'bleach':
          setShowColorBleach(true);
          break;
        case 'cotting':
          setShowColorCotting(true);
          break;
        case 'position-print':
          setShowColorPositionPrint(true);
          break;
        case 'finish':
          setShowColorFinish(true);
          break;
        case 'checking':
          setShowColorChecking(true);
          break;
        case 'delivery':
          setShowColorDelivery(true);
          break;
        default:
          console.log('Color Saree process not implemented:', process.id);
      }
    } else if (selectedSareeType === 'white') {
      switch (process.id) {
        case 'jecard':
          setShowWhiteJecard(true);
          break;
        case 'butta-cutting':
          setShowWhiteButtaCutting(true);
          break;
        case 'bleach':
          setShowWhiteBleach(true);
          break;
        case 'finish':
          setShowWhiteFinish(true);
          break;
        case 'delivery':
          setShowWhiteDelivery(true);
          break;
        default:
          console.log('White Saree process not implemented:', process.id);
      }
    } else if (selectedSareeType === 'garment') {
      // Use dedicated Garment pages
      switch (process.id) {
        case 'jecard':
          setShowGarmentEmbroidery(true);
          break;
        case 'butta-cutting':
          setShowGarmentButtaCutting(true);
          break;
        case 'bleach':
          setShowGarmentBleach(true);
          break;
        case 'cotting':
          setShowGarmentCotting(true);
          break;
        case 'position-print':
          setShowGarmentPositionPrint(true);
          break;
        case 'finish':
          setShowGarmentFinish(true);
          break;
        case 'checking':
          setShowGarmentChecking(true);
          break;
        case 'delivery':
          setShowGarmentDelivery(true);
          break;
        default:
          console.log('Garment process not implemented:', process.id);
      }
    }
    console.log('Selected process:', process);
  };
  // (Party Order removed from here; accessible from Chalan page)

  const whiteSareeButtons = [
    {
      id: 'jecard',
      title: 'JECARD',
      icon: 'layers',
      iconColor: '#00CED1',
      fullWidth: false,
    },
    {
      id: 'butta-cutting',
      title: 'BUTTA CUTTING',
      icon: 'cut',
      iconColor: '#FF6B35',
      fullWidth: false,
    },
    {
      id: 'bleach',
      title: 'BLEACH',
      icon: 'water',
      iconColor: '#00BFFF',
      fullWidth: false,
    },
    {
      id: 'finish',
      title: 'FINISH',
      icon: 'checkmark-circle',
      iconColor: '#FFD700',
      fullWidth: false,
    },
    {
      id: 'delivery',
      title: 'DELIVERY',
      icon: 'car',
      iconColor: '#00BFFF',
      fullWidth: true,
    },
  ];

  const colorSareeButtons = [
    {
      id: 'jecard',
      title: 'JECARD',
      icon: 'layers',
      iconColor: '#00CED1',
      fullWidth: false,
    },
    {
      id: 'butta-cutting',
      title: 'BUTTA CUTTING',
      icon: 'cut',
      iconColor: '#FF6B35',
      fullWidth: false,
    },
    {
      id: 'bleach',
      title: 'BLEACH',
      icon: 'water',
      iconColor: '#00BFFF',
      fullWidth: false,
    },
    {
      id: 'cotting',
      title: 'COTTING',
      icon: 'shirt',
      iconColor: '#9370DB',
      fullWidth: false,
    },
    {
      id: 'position-print',
      title: 'POSITION PRINT',
      icon: 'print',
      iconColor: '#00FFFF',
      fullWidth: false,
    },
    {
      id: 'finish',
      title: 'FINISH',
      icon: 'checkmark-circle',
      iconColor: '#FFD700',
      fullWidth: false,
    },
    {
      id: 'checking',
      title: 'CHECKING',
      icon: 'search',
      iconColor: '#32CD32',
      fullWidth: false,
    },
    {
      id: 'delivery',
      title: 'DELIVERY',
      icon: 'car',
      iconColor: '#00BFFF',
      fullWidth: false,
    },
  ];

  const garmentButtons = colorSareeButtons.map(btn =>
    btn.id === 'jecard' ? { ...btn, title: 'EMBROIDERY' } : btn
  );

  const getCurrentButtons = () => {
    if (selectedSareeType === 'white') return whiteSareeButtons;
    if (selectedSareeType === 'garment') return garmentButtons;
    return colorSareeButtons;
  };

  // All process pages removed; keep only the grid and selection

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {allowedType === 'color' ? 'Color Saree' : allowedType === 'white' ? 'White Saree' : allowedType === 'garment' ? 'Garment' : 'Select Saree Type'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Select Saree Type Section (show only when no lock) */}
        {!allowedType && (
        <View style={styles.sareeTypeSection}>
          <Text style={styles.sectionTitle}>Select Saree Type</Text>
          <View style={styles.sareeTypeButtons}>
            {/* Color Saree Button FIRST */}
            {shouldShowButton('color') && (
            <TouchableOpacity
              style={[
                styles.sareeTypeButton,
                selectedSareeType === 'color' && styles.sareeTypeButtonSelected
              ]}
              onPress={() => handleSareeTypeSelect('color')}
            >
              <Icon 
                name="color-palette" 
                size={20} 
                color={selectedSareeType === 'color' ? '#fff' : '#666'} 
              />
              <Text numberOfLines={1} style={[
                styles.sareeTypeButtonText,
                selectedSareeType === 'color' && styles.sareeTypeButtonTextSelected
              ]}>
                Color Saree
              </Text>
            </TouchableOpacity>
            )}

            {/* White Saree Button SECOND */}
            {shouldShowButton('white') && (
            <TouchableOpacity
              style={[
                styles.sareeTypeButton,
                selectedSareeType === 'white' && styles.sareeTypeButtonSelected
              ]}
              onPress={() => handleSareeTypeSelect('white')}
            >
              <Icon 
                name="ellipse" 
                size={20} 
                color={selectedSareeType === 'white' ? '#fff' : '#666'} 
              />
              <Text numberOfLines={1} style={[
                styles.sareeTypeButtonText,
                selectedSareeType === 'white' && styles.sareeTypeButtonTextSelected
              ]}>
                White Saree
              </Text>
            </TouchableOpacity>
            )}

            {/* Garment Button THIRD */}
            {shouldShowButton('garment') && (
            <TouchableOpacity 
              style={[
                styles.sareeTypeButton,
                selectedSareeType === 'garment' && styles.sareeTypeButtonSelected
              ]}
              onPress={() => handleSareeTypeSelect('garment')}
            >
              <Icon 
                name="shirt" 
                size={20} 
                color={selectedSareeType === 'garment' ? '#fff' : '#666'} 
              />
              <Text numberOfLines={1} style={[
                styles.sareeTypeButtonText,
                selectedSareeType === 'garment' && styles.sareeTypeButtonTextSelected
              ]}>Garment</Text>
            </TouchableOpacity>
            )}
          </View>
        </View>
        )}

        {/* Process Buttons Grid - Show when saree type is selected */}
        {selectedSareeType && (
          <View style={styles.processGrid}>
            {(selectedSareeType === 'garment' ? garmentButtons : getCurrentButtons()).map((process) => (
              <TouchableOpacity
                key={process.id}
                style={[
                  styles.processButton,
                  process.fullWidth && styles.processButtonFullWidth
                ]}
                onPress={() => handleProcessSelect(process)}
              >
                <Icon name={process.icon} size={24} color={process.iconColor} />
                <Text style={styles.processButtonText}>{process.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    backgroundColor: '#222222',
  },
  sareeTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sareeTypeButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sareeTypeButton: {
    width: '32%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
    borderWidth: 2,
    borderColor: '#555555',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 64,
  },
  sareeTypeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sareeTypeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
    maxWidth: '100%',
  },
  sareeTypeButtonTextSelected: {
    color: '#fff',
  },
  processGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 8,
  },
  garmentButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#8e79ff',
  },
  garmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  processButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#3A3A3A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 100,
    gap: 4,
    width: (width - 70) / 2,
    marginBottom: 10,
  },
  processButtonFullWidth: {
    width: '100%',
    minHeight: 85,
    marginBottom: 15,
  },
  processButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginTop: 2,
  },
});
