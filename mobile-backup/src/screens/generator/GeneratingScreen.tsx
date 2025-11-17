import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services/api.service';
import { GenerateWorkoutRequest } from '../../types/api.types';

type GeneratingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Generating'>;
  route: RouteProp<RootStackParamList, 'Generating'>;
};

const GeneratingScreen: React.FC<GeneratingScreenProps> = ({ navigation, route }) => {
  const { goal, daysPerWeek, equipment, experience } = route.params;
  const [status, setStatus] = useState('Preparing your workout plan...');

  useEffect(() => {
    generateWorkout();
  }, []);

  const generateWorkout = async () => {
    try {
      setStatus('AI is analyzing your preferences...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('Creating your personalized workout plan...');

      const request: GenerateWorkoutRequest = {
        goal: goal as any,
        daysPerWeek,
        equipment,
        experience: experience as any,
      };

      const workoutPlan = await apiService.generateWorkout(request);

      setStatus('Success! Your plan is ready.');

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
        'Generation Failed',
        error.response?.data?.error || 'Failed to generate workout plan. Please try again.',
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
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.subtitle}>This may take 10-20 seconds</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  status: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default GeneratingScreen;
