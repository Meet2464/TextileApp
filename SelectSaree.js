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
import ColorSareePartyOrder from './pages/ColorSaree/ColorSareePartyOrder';
import ColorSareeJecard from './pages/ColorSaree/ColorSareeJecard';
import ColorSareeButtaCutting from './pages/ColorSaree/ColorSareeButtaCutting';
import ColorSareeBleach from './pages/ColorSaree/ColorSareeBleach';
import ColorSareeCotting from './pages/ColorSaree/ColorSareeCotting';
import ColorSareePositionPrint from './pages/ColorSaree/ColorSareePositionPrint';
import ColorSareeFinish from './pages/ColorSaree/ColorSareeFinish';
import ColorSareeChecking from './pages/ColorSaree/ColorSareeChecking';
import ColorSareeDelivery from './pages/ColorSaree/ColorSareeDelivery';
import WhiteSareePartyOrder from './pages/WhiteSaree/WhiteSareePartyOrder';
import WhiteSareeJecard from './pages/WhiteSaree/WhiteSareeJecard';
import WhiteSareeButtaCutting from './pages/WhiteSaree/WhiteSareeButtaCutting';
import WhiteSareeBleach from './pages/WhiteSaree/WhiteSareeBleach';
import WhiteSareeFinish from './pages/WhiteSaree/WhiteSareeFinish';
import WhiteSareeDelivery from './pages/WhiteSaree/WhiteSareeDelivery';

const { width, height } = Dimensions.get('window');

export default function SelectSaree({ navigation, orderData }) {
  const [selectedSareeType, setSelectedSareeType] = useState('white');
  const [showColorPartyOrder, setShowColorPartyOrder] = useState(false);
  const [showColorJecard, setShowColorJecard] = useState(false);
  const [showColorButtaCutting, setShowColorButtaCutting] = useState(false);
  const [showColorBleach, setShowColorBleach] = useState(false);
  const [showColorCotting, setShowColorCotting] = useState(false);
  const [showColorPositionPrint, setShowColorPositionPrint] = useState(false);
  const [showColorFinish, setShowColorFinish] = useState(false);
  const [showColorChecking, setShowColorChecking] = useState(false);
  const [showColorDelivery, setShowColorDelivery] = useState(false);
  const [showWhitePartyOrder, setShowWhitePartyOrder] = useState(false);
  const [showWhiteJecard, setShowWhiteJecard] = useState(false);
  const [showWhiteButtaCutting, setShowWhiteButtaCutting] = useState(false);
  const [showWhiteBleach, setShowWhiteBleach] = useState(false);
  const [showWhiteFinish, setShowWhiteFinish] = useState(false);
  const [showWhiteDelivery, setShowWhiteDelivery] = useState(false);

  const handleBack = () => {
    navigation?.goBack();
  };

  const handleSareeTypeSelect = (type) => {
    setSelectedSareeType(type);
  };

  const handleProcessSelect = (process) => {
    if (selectedSareeType === 'color') {
      switch (process.id) {
        case 'party-order':
          setShowColorPartyOrder(true);
          break;
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
        case 'party-order':
          setShowWhitePartyOrder(true);
          break;
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
    }
    console.log('Selected process:', process);
  };

  const whiteSareeButtons = [
    {
      id: 'party-order',
      title: 'PARTY ORDER',
      icon: 'people',
      iconColor: '#FFD700',
      fullWidth: true,
    },
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
      id: 'party-order',
      title: 'PARTY ORDER',
      icon: 'people',
      iconColor: '#FFD700',
      fullWidth: true,
    },
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

  const getCurrentButtons = () => {
    return selectedSareeType === 'white' ? whiteSareeButtons : colorSareeButtons;
  };

  // Color Saree Process Pages
  if (showColorPartyOrder) {
    return (
      <ColorSareePartyOrder 
        navigation={{
          goBack: () => setShowColorPartyOrder(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorJecard) {
    return (
      <ColorSareeJecard 
        navigation={{
          goBack: () => setShowColorJecard(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorButtaCutting) {
    return (
      <ColorSareeButtaCutting 
        navigation={{
          goBack: () => setShowColorButtaCutting(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorBleach) {
    return (
      <ColorSareeBleach 
        navigation={{
          goBack: () => setShowColorBleach(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorCotting) {
    return (
      <ColorSareeCotting 
        navigation={{
          goBack: () => setShowColorCotting(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorPositionPrint) {
    return (
      <ColorSareePositionPrint 
        navigation={{
          goBack: () => setShowColorPositionPrint(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorFinish) {
    return (
      <ColorSareeFinish 
        navigation={{
          goBack: () => setShowColorFinish(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorChecking) {
    return (
      <ColorSareeChecking 
        navigation={{
          goBack: () => setShowColorChecking(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showColorDelivery) {
    return (
      <ColorSareeDelivery 
        navigation={{
          goBack: () => setShowColorDelivery(false)
        }}
        orderData={orderData}
      />
    );
  }

  // White Saree Process Pages
  if (showWhitePartyOrder) {
    return (
      <WhiteSareePartyOrder 
        navigation={{
          goBack: () => setShowWhitePartyOrder(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showWhiteJecard) {
    return (
      <WhiteSareeJecard 
        navigation={{
          goBack: () => setShowWhiteJecard(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showWhiteButtaCutting) {
    return (
      <WhiteSareeButtaCutting 
        navigation={{
          goBack: () => setShowWhiteButtaCutting(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showWhiteBleach) {
    return (
      <WhiteSareeBleach 
        navigation={{
          goBack: () => setShowWhiteBleach(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showWhiteFinish) {
    return (
      <WhiteSareeFinish 
        navigation={{
          goBack: () => setShowWhiteFinish(false)
        }}
        orderData={orderData}
      />
    );
  }

  if (showWhiteDelivery) {
    return (
      <WhiteSareeDelivery 
        navigation={{
          goBack: () => setShowWhiteDelivery(false)
        }}
        orderData={orderData}
      />
    );
  }

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
          <Text style={styles.headerTitle}>Select Saree Type</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Select Saree Type Section */}
        <View style={styles.sareeTypeSection}>
          <Text style={styles.sectionTitle}>Select Saree Type</Text>
          
          <View style={styles.sareeTypeButtons}>
            {/* White Saree Button */}
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
              <Text style={[
                styles.sareeTypeButtonText,
                selectedSareeType === 'white' && styles.sareeTypeButtonTextSelected
              ]}>
                White Saree
              </Text>
            </TouchableOpacity>

            {/* Color Saree Button */}
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
              <Text style={[
                styles.sareeTypeButtonText,
                selectedSareeType === 'color' && styles.sareeTypeButtonTextSelected
              ]}>
                Color Saree
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Process Buttons Grid - Show when saree type is selected */}
        {selectedSareeType && (
          <View style={styles.processGrid}>
            {getCurrentButtons().map((process) => (
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
    gap: 15,
  },
  sareeTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
    borderWidth: 2,
    borderColor: '#555555',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sareeTypeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sareeTypeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
