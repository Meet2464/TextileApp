import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function WhiteSareePartyOrder({ navigation, orderData }) {
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
          <Text style={styles.headerTitle}>White Saree - Party Order</Text>
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
          <View style={styles.orderDetails}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            
            {orderData && (
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order No:</Text>
                  <Text style={styles.detailValue}>{orderData.poNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Party Name:</Text>
                  <Text style={styles.detailValue}>{orderData.partyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Design No:</Text>
                  <Text style={styles.detailValue}>{orderData.designNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{orderData.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date:</Text>
                  <Text style={styles.detailValue}>{orderData.orderDate}</Text>
                </View>
              </View>
            )}

            <View style={styles.processInfo}>
              <Text style={styles.sectionTitle}>White Saree Process</Text>
              <Text style={styles.processDescription}>
                This is the White Saree Party Order page. Here you can manage the specific processes for white saree production including JECARD, BUTTA CUTTING, BLEACH, FINISH, and DELIVERY.
              </Text>
            </View>
          </View>
        </ScrollView>
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
});
