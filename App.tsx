
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from '@navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;