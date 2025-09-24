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
  const { user, userData, logout, getTenantId } = useUser();
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

  const formatDDMMYYYY = (dateInput) => {
    try {
      const d = new Date(dateInput);
      if (Number.isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  };

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

  const handleReport = () => {
    Alert.alert('Reports', 'Reports coming soon');
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
      const tenantId = getTenantId?.() || userData.companyId;
      const q = query(
        collection(db, 'approvalRequests'),
        where('bossCompanyId', '==', tenantId),
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

          <TouchableOpacity style={styles.mainButton} onPress={handleReport}>
            <Text style={styles.mainButtonText}>REPORT</Text>
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
              <View style={styles.iconWithBadge}>
                <Icon 
                  name="mail-outline" 
                  size={24} 
                  color={activeTab === 'INVITE' ? '#007AFF' : '#FFFFFF'} 
                />
                {pendingRequests.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {pendingRequests.length > 99 ? '99+' : String(pendingRequests.length)}
                    </Text>
                  </View>
                )}
              </View>
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
            
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(userData?.username || 'U')
                    .toString()
                    .trim()
                    .split(' ')
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.avatarEditButton} activeOpacity={0.8}>
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Fields */}
            <View style={styles.fieldsContainer}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Name</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{userData?.username || '—'}</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{userData?.email || '—'}</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Company ID</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{userData?.companyId || '—'}</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Role</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{userData?.role || '—'}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={async () => {
                try {
                  console.log('Logout button pressed');
                  await logout();
                  console.log('Logout successful');
                    // Close modal and reset UI
                    setShowProfile(false);
                    setShowInviteApproval(false);
                    setShowDesignPage(false);
                    setShowOrderPage(false);
                    setShowChalanPage(false);
                    setActiveTab('HOME');
                    // Navigate to Login screen
                    navigation.navigate('Login');
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
                      <View style={styles.inviteItemLeft}>
                        <View style={styles.inviteItemAvatar}>
                          <Text style={styles.inviteItemAvatarText}>
                            {(request.employeeUsername || 'U')
                              .toString()
                              .trim()
                              .split(' ')
                              .map(part => part[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.inviteItemInfo}>
                          <Text style={styles.inviteItemName}>{request.employeeUsername}</Text>
                          <Text style={styles.inviteItemEmail}>{request.employeeEmail}</Text>
                          <Text style={styles.inviteItemDate}>
                            Requested: {formatDDMMYYYY(request.createdAt)}
                          </Text>
                        </View>
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
    backgroundColor: '#222222',
  },
  card: {
    flex: 1,
    backgroundColor: '#2A2A2A',
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
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    marginVertical: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#555555',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
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
    borderWidth: 1,
    borderColor: '#333333',
  },
  navIconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: '#2A2A2A',
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
    borderWidth: 1,
    borderColor: '#555555',
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
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  avatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarEditButton: {
    position: 'absolute',
    right: (width * 0.8 - 84) / 2 - 6,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fieldsContainer: {
    flex: 1,
    paddingHorizontal: 6,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  fieldBox: {
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#555555',
  },
  fieldValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
    backgroundColor: '#2A2A2A',
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
    borderWidth: 1,
    borderColor: '#555555',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 15,
  },
  inviteItem: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  inviteItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  inviteItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  inviteItemAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inviteItemInfo: {
    flex: 1,
  },
  inviteItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  inviteItemEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  inviteItemRole: {
    fontSize: 12,
    color: '#00BFFF',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  inviteItemDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
});
