import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from './contexts/UserContext';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import OrderNoPage from './OrderNoPage';
import ChalanNoPage from './ChalanNoPage';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, userData, logout } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [showInviteApproval, setShowInviteApproval] = useState(false);

  // Debug logging
  console.log('HomeScreen - user:', user);
  console.log('HomeScreen - userData:', userData);
  const [showDesignPage, setShowDesignPage] = useState(false);
  const [showOrderPage, setShowOrderPage] = useState(false);
  const [showChalanPage, setShowChalanPage] = useState(false);
  const [activeTab, setActiveTab] = useState('HOME');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Load pending requests when userData changes
  useEffect(() => {
    if (userData?.role === 'boss' && userData?.companyId) {
      loadPendingRequests();
    }
  }, [userData]);

  const handleDesignNo = () => {
    navigation.navigate('DesignNo');
  };

  const handleOrderNo = () => {
    setShowOrderPage(true);
  };

  const handleChalanNo = () => {
    setShowChalanPage(true);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setActiveTab('PROFILE');
  };

  const handleHomeClick = () => {
    setShowProfile(false);
    setShowInviteApproval(false);
    setShowDesignPage(false);
    setShowOrderPage(false);
    setShowChalanPage(false);
    setActiveTab('HOME');
  };

  const handleInviteApprovalClick = () => {
    if (userData?.role === 'boss') {
      setShowInviteApproval(true);
      setActiveTab('INVITE');
      loadPendingRequests();
    }
  };

  const loadPendingRequests = async () => {
    if (userData?.role !== 'boss' || !userData?.companyId) {
      setPendingRequests([]);
      return;
    }
    
    setLoadingRequests(true);
    try {
      const q = query(
        collection(db, 'approvalRequests'),
        where('bossCompanyId', '==', userData.companyId),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading requests:', error);
      // Don't show alert for permission errors, just log them
      if (error.code !== 'permission-denied') {
        Alert.alert('Error', 'Failed to load approval requests');
      }
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId, employeeId) => {
    try {
      // Update the approval request status
      await updateDoc(doc(db, 'approvalRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Update the employee's user document
      await updateDoc(doc(db, 'users', employeeId), {
        isActive: true,
        companyId: userData.companyId,
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Employee approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      let errorMessage = 'Failed to approve request';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firebase security rules.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Request or employee not found.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRejectRequest = async (requestId, employeeId) => {
    try {
      // Update the approval request status
      await updateDoc(doc(db, 'approvalRequests', requestId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      // Update the employee's user document
      await updateDoc(doc(db, 'users', employeeId), {
        approvalStatus: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Employee request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      let errorMessage = 'Failed to reject request';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firebase security rules.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Request or employee not found.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // If any page is shown, render it
  if (showDesignPage) {
    return (
      <DesignNoPage 
        navigation={{
          goBack: () => setShowDesignPage(false)
        }}
      />
    );
  }

  if (showOrderPage) {
    return (
      <OrderNoPage 
        navigation={{
          goBack: () => setShowOrderPage(false)
        }}
      />
    );
  }

  if (showChalanPage) {
    return (
      <ChalanNoPage 
        navigation={{
          goBack: () => setShowChalanPage(false)
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Content Card */}
      <View style={styles.card}>
        {/* Main Action Buttons */}
        <View style={styles.mainButtonsContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleDesignNo}>
            <Text style={styles.mainButtonText}>DESIGN NO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} onPress={handleOrderNo}>
            <Text style={styles.mainButtonText}>ORDER NO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} onPress={handleChalanNo}>
            <Text style={styles.mainButtonText}>CHALAN NO</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navIconButton} 
            onPress={handleHomeClick}
          >
            <Icon 
              name="home-outline" 
              size={24} 
              color={activeTab === 'HOME' ? '#007AFF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
          
          {/* Only show invite approval for boss */}
          {userData?.role === 'boss' && (
            <TouchableOpacity 
              style={styles.navIconButton} 
              onPress={handleInviteApprovalClick}
            >
              <Icon 
                name="mail-outline" 
                size={24} 
                color={activeTab === 'INVITE' ? '#007AFF' : '#FFFFFF'} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.navIconButton} 
            onPress={handleProfileClick}
          >
            <Icon 
              name="person-outline" 
              size={24} 
              color={activeTab === 'PROFILE' ? '#007AFF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Popup Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowProfile(false);
          setActiveTab('HOME');
        }}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowProfile(false);
                  setActiveTab('HOME');
                }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileContent}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Username:</Text>
                <Text style={styles.profileValue}>{userData?.username || 'N/A'}</Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>{userData?.email || 'N/A'}</Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Company ID:</Text>
                <Text style={styles.profileValue}>{userData?.companyId || 'N/A'}</Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Role:</Text>
                <Text style={styles.profileValue}>{userData?.role || 'N/A'}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={async () => {
                try {
                  console.log('Logout button pressed');
                  await logout();
                  console.log('Logout successful');
                } catch (error) {
                  console.error('Logout error:', error);
                  Alert.alert('Error', 'Failed to logout. Please try again.');
                }
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invite Approval Popup Modal */}
      <Modal
        visible={showInviteApproval}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowInviteApproval(false);
          setActiveTab('HOME');
        }}
      >
        <View style={styles.inviteModalOverlay}>
          <View style={styles.inviteModalContent}>
            <View style={styles.inviteHeader}>
              <Text style={styles.inviteTitle}>Invite Approval</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowInviteApproval(false);
                  setActiveTab('HOME');
                }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.inviteContent}>
              <View style={styles.inviteSection}>
                <Text style={styles.inviteSectionTitle}>Pending Approval Requests</Text>
                {loadingRequests ? (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingText}>Loading requests...</Text>
                  </View>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <View key={request.id} style={styles.inviteItem}>
                      <View style={styles.inviteItemInfo}>
                        <Text style={styles.inviteItemName}>{request.employeeUsername}</Text>
                        <Text style={styles.inviteItemEmail}>{request.employeeEmail}</Text>
                        <Text style={styles.inviteItemRole}>Company ID: {request.requestedCompanyId}</Text>
                        <Text style={styles.inviteItemDate}>
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApproveRequest(request.id, request.employeeId)}
                        >
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectRequest(request.id, request.employeeId)}
                        >
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="mail-outline" size={48} color="#CCCCCC" />
                    <Text style={styles.emptyStateText}>No pending approval requests</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD700',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  mainButtonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    marginVertical: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navIconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: '#fff',
    width: width * 0.8,
    height: height * 0.9,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  profileContent: {
    flex: 1,
  },
  profileInfo: {
    marginBottom: 20,
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Invite Approval Modal Styles
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  inviteModalContent: {
    backgroundColor: '#fff',
    width: width * 0.8,
    height: height * 0.9,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  inviteContent: {
    flex: 1,
  },
  inviteSection: {
    marginBottom: 30,
  },
  inviteSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  inviteItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteItemInfo: {
    flex: 1,
  },
  inviteItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  inviteItemEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  inviteItemRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sendInviteButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  sendInviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inviteItemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
