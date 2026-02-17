import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';
import CityMapScreen from './src/screens/CityMapScreen';
import BossBattleScreen from './src/screens/BossBattleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClassSelectionScreen from './src/screens/ClassSelectionScreen';
import QuestScreen from './src/screens/QuestScreen';
import UsageStatsService from './src/services/UsageStatsService';

const Stack = createNativeStackNavigator();

export default function App() {
  // Permission check moved to Dashboard or handled lazily

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            initialParams={{ userId: '7eb3fffc-d50b-4952-99b4-a9312aeca561' }} // Use my test user ID for now
          />
          <Stack.Screen name="Rules" component={RulesScreen} />
          <Stack.Screen name="CityMap" component={CityMapScreen} />
          <Stack.Screen name="BossBattle" component={BossBattleScreen} />
          <Stack.Screen name="Quests" component={QuestScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ClassSelection" component={ClassSelectionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
