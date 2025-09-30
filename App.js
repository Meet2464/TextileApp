import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider, useUser } from './contexts/UserContext';
import LoginScreen from './LoginScreen';
import RoleSelection from './RoleSelection';
import BossRegistration from './BossRegistration';
import EmployeeRegistration from './EmployeeRegistration';
import HomeScreen from './HomeScreen';
import DesignNoPage from './DesignNoPage';

function AppContent() {
  const { user, userData, loading } = useUser();
  const [currentScreen, setCurrentScreen] = useState('Login');

  // Ask storage permission once on first app open (Android) for saving to Downloads
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const asked = await AsyncStorage.getItem('mlib_perm_done');
          if (!asked) {
            await MediaLibrary.requestPermissionsAsync();
            await AsyncStorage.setItem('mlib_perm_done', '1');
          }
        }
      } catch {}
    })();
  }, []);

  const navigation = {
    navigate: (screen) => {
      console.log('Navigating to:', screen);
      setCurrentScreen(screen);
    },
    goBack: () => {
      console.log('Going back');
      setCurrentScreen('Login');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // If user is logged in and has userData, set default screen to Home
  // Bosses always go to Home; active employees go to Home even if isNewRegistration wasn't cleared
  if (user && userData && currentScreen === 'Login') {
    const shouldGoHome = userData.role === 'boss' || userData.isActive === true || userData.isNewRegistration === false;
    if (shouldGoHome) {
      setCurrentScreen('Home');
    }
  }

  // Render different screens based on currentScreen state
  switch (currentScreen) {
    case 'Home':
      return <HomeScreen navigation={navigation} />;
    case 'RoleSelection':
      return <RoleSelection navigation={navigation} />;
    case 'BossRegistration':
      return <BossRegistration navigation={navigation} />;
    case 'EmployeeRegistration':
      return <EmployeeRegistration navigation={navigation} />;
    case 'DesignNo':
      return <DesignNoPage navigation={navigation} />;
    default:
      return <LoginScreen navigation={navigation} />;
  }
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD700',
  },
  header: {
    height: 120,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
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
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  userText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
