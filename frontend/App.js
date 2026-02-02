import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';
import KingdomScreen from './src/screens/KingdomScreen';
import BossBattleScreen from './src/screens/BossBattleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClassSelectionScreen from './src/screens/ClassSelectionScreen';
import GatewayScreen from './src/screens/GatewayScreen';
import UsageStatsService from './src/services/UsageStatsService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkPermission = async () => {
    const hasPerm = await UsageStatsService.hasPermission();
    setHasPermission(hasPerm);
    setChecking(false);
  };

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (checking) {
    return null; // Or a splash screen
  }

  return (
    <SafeAreaProvider>
      {hasPermission ? (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={DashboardScreen} initialParams={{ userId: '7eb3fffc-d50b-4952-99b4-a9312aeca561' }} />
            <Stack.Screen name="Rules" component={RulesScreen} />
            <Stack.Screen name="Kingdom" component={KingdomScreen} />
            <Stack.Screen name="BossBattle" component={BossBattleScreen} options={{ title: 'Boss Battle' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ClassSelection" component={ClassSelectionScreen} options={{ title: 'Choose Class', headerLeft: null }} />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <GatewayScreen onPermissionGranted={checkPermission} />
      )}
    </SafeAreaProvider>
  );
}
