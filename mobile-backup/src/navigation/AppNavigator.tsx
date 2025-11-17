import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import PlansScreen from '../screens/plans/PlansScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Workout Generator Screens
import GoalScreen from '../screens/generator/GoalScreen';
import DaysPerWeekScreen from '../screens/generator/DaysPerWeekScreen';
import EquipmentScreen from '../screens/generator/EquipmentScreen';
import ExperienceScreen from '../screens/generator/ExperienceScreen';
import GeneratingScreen from '../screens/generator/GeneratingScreen';

// Plan Screens
import PlanDetailsScreen from '../screens/plans/PlanDetailsScreen';
import SessionScreen from '../screens/session/SessionScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Plans: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  GoalSelection: undefined;
  DaysPerWeek: { goal: string };
  Equipment: { goal: string; daysPerWeek: number };
  Experience: { goal: string; daysPerWeek: number; equipment: string[] };
  Generating: {
    goal: string;
    daysPerWeek: number;
    equipment: string[];
    experience: string;
  };
  PlanDetails: { planId: string };
  Session: { sessionId: string; sessionName: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plans" component={PlansScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="GoalSelection"
        component={GoalScreen}
        options={{ title: 'Select Your Goal' }}
      />
      <RootStack.Screen
        name="DaysPerWeek"
        component={DaysPerWeekScreen}
        options={{ title: 'Training Frequency' }}
      />
      <RootStack.Screen
        name="Equipment"
        component={EquipmentScreen}
        options={{ title: 'Available Equipment' }}
      />
      <RootStack.Screen
        name="Experience"
        component={ExperienceScreen}
        options={{ title: 'Experience Level' }}
      />
      <RootStack.Screen
        name="Generating"
        component={GeneratingScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="PlanDetails"
        component={PlanDetailsScreen}
        options={{ title: 'Workout Plan' }}
      />
      <RootStack.Screen
        name="Session"
        component={SessionScreen}
        options={{ title: 'Training Session' }}
      />
    </RootStack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
