// App.tsx
import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import {LoginScreen} from './src/screens/LoginScreen';
import {useAuthStore} from './src/state/authStore';
import './src/i18n/config';

function App() {
  const {isAuthenticated, isLoading} = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <PaperProvider>
      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <View style={styles.container}>
          {/* Dashboard or main app content will go here */}
        </View>
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;