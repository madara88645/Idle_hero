import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';

import KingdomScreen from './src/screens/KingdomScreen';
import BossBattleScreen from './src/screens/BossBattleScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Dashboard" component={DashboardScreen} initialParams={{ userId: '7eb3fffc-d50b-4952-99b4-a9312aeca561' }} />
          <Stack.Screen name="Rules" component={RulesScreen} />
          <Stack.Screen name="Kingdom" component={KingdomScreen} />
          <Stack.Screen name="BossBattle" component={BossBattleScreen} options={{ title: 'Boss Battle' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
