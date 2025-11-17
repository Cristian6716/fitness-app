import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ExperienceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Experience'>;
  route: RouteProp<RootStackParamList, 'Experience'>;
};

const experienceLevels = [
  { id: 'beginner', label: 'Beginner', description: 'New to training' },
  { id: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
  { id: 'advanced', label: 'Advanced', description: '3+ years experience' },
];

const ExperienceScreen: React.FC<ExperienceScreenProps> = ({ navigation, route }) => {
  const { goal, daysPerWeek, equipment } = route.params;
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  const handleGenerate = () => {
    if (selectedExperience) {
      navigation.navigate('Generating', {
        goal,
        daysPerWeek,
        equipment,
        experience: selectedExperience,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Experience Level</Text>
      <Text style={styles.subtitle}>What's your training experience?</Text>

      <View style={styles.optionsContainer}>
        {experienceLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionCard,
              selectedExperience === level.id && styles.optionCardActive,
            ]}
            onPress={() => setSelectedExperience(level.id)}
          >
            <Text
              style={[
                styles.optionLabel,
                selectedExperience === level.id && styles.optionLabelActive,
              ]}
            >
              {level.label}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                selectedExperience === level.id && styles.optionDescriptionActive,
              ]}
            >
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedExperience && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={!selectedExperience}
      >
        <Text style={styles.buttonText}>Generate Workout Plan</Text>
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

export default ExperienceScreen;
