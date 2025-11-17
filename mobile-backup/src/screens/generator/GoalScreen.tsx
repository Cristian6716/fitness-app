import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type GoalScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GoalSelection'>;
};

const goals = [
  { id: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle mass' },
  { id: 'strength', label: 'Strength', description: 'Increase overall strength' },
  { id: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { id: 'general_fitness', label: 'General Fitness', description: 'Stay healthy and active' },
];

const GoalScreen: React.FC<GoalScreenProps> = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedGoal) {
      navigation.navigate('DaysPerWeek', { goal: selectedGoal });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What is your fitness goal?</Text>
      <Text style={styles.subtitle}>Select one that best matches your objective</Text>

      <View style={styles.optionsContainer}>
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.optionCard, selectedGoal === goal.id && styles.optionCardActive]}
            onPress={() => setSelectedGoal(goal.id)}
          >
            <Text
              style={[styles.optionLabel, selectedGoal === goal.id && styles.optionLabelActive]}
            >
              {goal.label}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                selectedGoal === goal.id && styles.optionDescriptionActive,
              ]}
            >
              {goal.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedGoal && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!selectedGoal}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
  },
  optionCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionDescriptionActive: {
    color: '#0056b3',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GoalScreen;
