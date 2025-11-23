// App.tsx
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import firestore from '@react-native-firebase/firestore';

function App() {
  const [status, setStatus] = useState<string>('테스트 중...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      await firestore().collection('test').add({
        message: 'Hello from ZipTaxi!',
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      setStatus('✅ Firebase 연동 성공!');
      setIsLoading(false);
    } catch (error) {
      setStatus(`❌ Firebase 연동 실패: ${error}`);
      setIsLoading(false);
      console.error('Firebase 에러:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZipTaxi - Firebase 테스트</Text>
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      <Text style={[
        styles.status,
        status.includes('성공') ? styles.success : styles.error
      ]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export default App;