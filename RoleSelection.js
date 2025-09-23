import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function RoleSelection({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.navigate('Login')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
            <Icon name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>
      </View>

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
        <Text style={styles.welcomeTitle}>Choose Your Role</Text>
        <Text style={styles.welcomeSubtitle}>Select the type of account you want to create</Text>

        {/* Boss Button */}
        <TouchableOpacity 
          style={styles.roleButton}
          onPress={() => navigation.navigate('BossRegistration')}
        >
          <Text style={styles.roleButtonText}>Boss</Text>
        </TouchableOpacity>

        {/* Employee Button */}
        <TouchableOpacity 
          style={styles.roleButton}
          onPress={() => navigation.navigate('EmployeeRegistration')}
        >
          <Text style={styles.roleButtonText}>Employee</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Already have account?{' '}
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Log In
            </Text>
          </Text>
        </View>
      </View>
    </View>
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
  roleButton: {
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 15,
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loginText: {
    fontSize: 14,
    color: '#000',
  },
  loginLink: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
