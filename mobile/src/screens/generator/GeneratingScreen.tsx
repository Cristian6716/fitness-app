import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services/api.service';
import { GenerateWorkoutRequest } from '../../types/api.types';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

type GeneratingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Generating'>;
  route: RouteProp<RootStackParamList, 'Generating'>;
};

const GeneratingScreen: React.FC<GeneratingScreenProps> = ({ navigation, route }) => {
  const workoutData = route.params;
  const [status, setStatus] = useState('Preparazione del tuo piano di allenamento...');
  const { completeOnboarding } = useAuth();

  useEffect(() => {
    generateWorkout();
  }, []);

  const generateWorkout = async () => {
    try {
      setStatus('L\'AI sta analizzando le tue preferenze...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('Creazione del tuo piano di allenamento personalizzato...');

      const request: GenerateWorkoutRequest = {
        age: workoutData.age,
        weight: workoutData.weight,
        height: workoutData.height,
        gender: workoutData.gender,
        goal: workoutData.goal,
        goalDetails: workoutData.goalDetails,
        daysPerWeek: workoutData.daysPerWeek,
        sessionDuration: workoutData.sessionDuration,
        scheduleNotes: workoutData.scheduleNotes,
        equipment: workoutData.equipment,
        equipmentDetails: workoutData.equipmentDetails,
        experienceLevel: workoutData.experienceLevel,
        experienceDetails: workoutData.experienceDetails,
        limitations: workoutData.limitations,
        weakPoints: workoutData.weakPoints,
        cardioPreference: workoutData.cardioPreference,
        cardioDetails: workoutData.cardioDetails,
        splitPreference: workoutData.splitPreference,
        currentWeights: workoutData.currentWeights,
      };

      const workoutPlan = await apiService.generateWorkout(request);

      setStatus('Successo! Il tuo piano è pronto.');

      // Mark onboarding as completed
      try {
        await completeOnboarding();
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Don't block the user if this fails
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to plan details and reset stack to prevent going back
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'MainTabs' },
            { name: 'PlanDetails', params: { planId: workoutPlan.id } },
          ],
        })
      );
    } catch (error: any) {
      console.error('Generate workout error:', error);
      Alert.alert(
        'Generazione Fallita',
        error.response?.data?.error || 'Impossibile generare il piano di allenamento. Riprova.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.subtitle}>Potrebbe richiedere 10-20 secondi</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  status: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default GeneratingScreen;
