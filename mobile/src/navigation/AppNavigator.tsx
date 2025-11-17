import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import FirstTimeScreen from '../screens/home/FirstTimeScreen';
import FileUploadScreen from '../screens/home/FileUploadScreen';
import PlansScreen from '../screens/plans/PlansScreen';
import { NewsScreen } from '../screens/news/NewsScreen';
import { NewsDetailScreen } from '../screens/news/NewsDetailScreen';
import { ProfileModal } from '../components/ProfileModal';
import { HeaderProfileButton } from '../components/HeaderProfileButton';

// Workout Generator Screens
import PersonalInfoScreen from '../screens/generator/PersonalInfoScreen';
import GoalScreen from '../screens/generator/GoalScreen';
import FrequencyScreen from '../screens/generator/FrequencyScreen';
import EquipmentScreen from '../screens/generator/EquipmentScreen';
import ExperienceScreen from '../screens/generator/ExperienceScreen';
import LimitationsScreen from '../screens/generator/LimitationsScreen';
import AdvancedScreen from '../screens/generator/AdvancedScreen';
import CurrentWeightsScreen from '../screens/generator/CurrentWeightsScreen';
import GeneratingScreen from '../screens/generator/GeneratingScreen';

// Plan Screens
import PlanDetailsScreen from '../screens/plans/PlanDetailsScreen';
import ReviewImportedPlanScreen from '../screens/plans/ReviewImportedPlanScreen';
import SessionScreen from '../screens/session/SessionScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Plans: undefined;
  News: undefined;
};

export interface PersonalInfo {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
}

export interface WorkoutData extends PersonalInfo {
  goal: string;
  goalDetails?: string;
  daysPerWeek: number;
  sessionDuration?: number;
  scheduleNotes?: string;
  equipment: string[];
  equipmentDetails?: string;
  experienceLevel?: string;
  experienceDetails?: string;
  limitations?: string;
  weakPoints?: string;
  cardioPreference?: string;
  cardioDetails?: string;
  splitPreference?: string;
  currentWeights?: {
    benchPress?: number;
    squat?: number;
    deadlift?: number;
    militaryPress?: number;
    pullUps?: 'bodyweight' | 'weighted' | 'cant';
    pullUpsWeight?: number;
    other?: string;
  };
}

export type RootStackParamList = {
  MainTabs: undefined;
  ProfileModal: undefined;
  FirstTime: undefined;
  FileUpload: undefined;
  PersonalInfo: undefined;
  GoalSelection: { personalInfo: PersonalInfo };
  Frequency: { personalInfo: PersonalInfo; goal: string; goalDetails?: string };
  Equipment: { personalInfo: PersonalInfo; goal: string; goalDetails?: string; daysPerWeek: number; sessionDuration?: number; scheduleNotes?: string };
  Experience: Partial<WorkoutData>;
  Limitations: Partial<WorkoutData>;
  Advanced: Partial<WorkoutData>;
  CurrentWeights: Partial<WorkoutData>;
  Generating: WorkoutData;
  PlanDetails: { planId: string; planName?: string };
  Session: { sessionId: string; sessionName: string };
  ReviewImportedPlan: { parsedData: any; warnings?: string[] };
  NewsDetail: { articleId: string };
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
  const insets = useSafeAreaInsets();

  // Calcola il padding bottom: usa insets o un minimo di 8px
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDarker,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 60 + bottomPadding,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          tabBarLabel: 'Piani',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          tabBarLabel: 'Notizie',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { user } = useAuth();

  return (
    <RootStack.Navigator
      initialRouteName={user?.hasCompletedOnboarding ? 'MainTabs' : 'FirstTime'}
    >
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="FirstTime"
        component={FirstTimeScreen}
        options={{
          title: 'Inizia il tuo percorso',
          headerBackVisible: false,
        }}
      />
      <RootStack.Screen
        name="FileUpload"
        component={FileUploadScreen}
        options={{ title: 'Importa Piano' }}
      />
      <RootStack.Screen
        name="PersonalInfo"
        component={PersonalInfoScreen}
        options={{ title: 'Informazioni Personali' }}
      />
      <RootStack.Screen
        name="GoalSelection"
        component={GoalScreen}
        options={{ title: 'Obiettivo' }}
      />
      <RootStack.Screen
        name="Frequency"
        component={FrequencyScreen}
        options={{ title: 'Frequenza Allenamento' }}
      />
      <RootStack.Screen
        name="Equipment"
        component={EquipmentScreen}
        options={{ title: 'Attrezzatura' }}
      />
      <RootStack.Screen
        name="Experience"
        component={ExperienceScreen}
        options={{ title: 'Esperienza' }}
      />
      <RootStack.Screen
        name="Limitations"
        component={LimitationsScreen}
        options={{ title: 'Limitazioni' }}
      />
      <RootStack.Screen
        name="Advanced"
        component={AdvancedScreen}
        options={{ title: 'Preferenze Avanzate' }}
      />
      <RootStack.Screen
        name="CurrentWeights"
        component={CurrentWeightsScreen}
        options={{ title: 'Carichi Attuali' }}
      />
      <RootStack.Screen
        name="Generating"
        component={GeneratingScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="PlanDetails"
        component={PlanDetailsScreen}
        options={({ route }) => ({
          title: route.params?.planName || 'Piano di Allenamento',
          headerShown: false,
        })}
      />
      <RootStack.Screen
        name="ReviewImportedPlan"
        component={ReviewImportedPlanScreen}
        options={{ title: 'Conferma Piano' }}
      />
      <RootStack.Screen
        name="Session"
        component={SessionScreen}
        options={{ title: 'Sessione di Allenamento' }}
      />
      <RootStack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ headerShown: false }}
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
