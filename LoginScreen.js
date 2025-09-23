import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !companyId || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Convert email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      // Login with Firebase Auth (email will be lowercase)
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Handle different user roles
        if (userData.role === 'boss') {
          // Boss login - verify company ID matches (case-insensitive)
          const storedCompanyId = (userData.companyId || '').toString().trim().toLowerCase();
          const enteredCompanyId = companyId.toString().trim().toLowerCase();
          if (storedCompanyId !== enteredCompanyId) {
            Alert.alert('Error', 'Company ID is not available');
            await auth.signOut();
            setLoading(false);
            return;
          }
          // Boss login successful - no alert needed, UserContext will handle navigation
        } else if (userData.role === 'employee') {
          // Employee login - handle approval process
          if (!userData.isActive) {
            // Employee is not active, check if they need to request approval
            if (!userData.requestedCompanyId) {
              // First time login - request approval with company ID
              await updateDoc(doc(db, 'users', user.uid), {
                requestedCompanyId: companyId.trim(),
                approvalStatus: 'pending'
              });
              
              // Create approval request for boss
              await addDoc(collection(db, 'approvalRequests'), {
                employeeId: user.uid,
                employeeEmail: normalizedEmail,
                employeeUsername: userData.username,
                requestedCompanyId: companyId.trim(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                bossCompanyId: companyId.trim() // This will help boss find their requests
              });
              
              Alert.alert(
                'Approval Request Sent', 
                'Your approval request has been sent to the boss. Please wait for approval.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await auth.signOut();
                    }
                  }
                ]
              );
            } else {
              // Already requested approval
              Alert.alert(
                'Pending Approval', 
                'Your approval request is still pending. Please wait for the boss to approve your access.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await auth.signOut();
                    }
                  }
                ]
              );
            }
          } else {
            // Employee is active - verify company ID (case-insensitive)
            const storedCompanyId = (userData.companyId || '').toString().trim().toLowerCase();
            const enteredCompanyId = companyId.toString().trim().toLowerCase();
            if (storedCompanyId !== enteredCompanyId) {
              Alert.alert('Error', 'Company ID is not available');
              await auth.signOut();
              setLoading(false);
              return;
            }
            // Employee login successful - no alert needed, UserContext will handle navigation
          }
        }
      } else {
        Alert.alert('Error', 'User data not found');
        await auth.signOut();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('./assets/Enter-logo.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />
      </View>

      {/* Main Content Card */}
      <View style={styles.card}>
        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeSubtitle}>Please enter your details</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        {/* Company ID Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Company ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your company ID"
              value={companyId}
              onChangeText={setCompanyId}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleButtonText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <View style={styles.optionsContainer}>
          <View style={styles.placeholder} />
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.signInButtonText}>
            {loading ? 'Loading...' : 'Sign in'}
          </Text>
        </TouchableOpacity>


        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
            <Text 
              style={styles.signUpLink}
              onPress={() => navigation.navigate('RoleSelection')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD700', // Yellow background
  },
  header: {
    height: height * 0.18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 12,
  },
  appLogo: {
    width: width * 0.9,
    height: 300,
    alignSelf: 'flex-start',
  },
  playIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
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
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  toggleButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  placeholder: {
    flex: 1,
  },
  forgotText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#000',
  },
  signUpLink: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
