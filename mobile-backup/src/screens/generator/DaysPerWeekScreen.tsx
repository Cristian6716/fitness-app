import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

type DaysPerWeekScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DaysPerWeek'>;
  route: RouteProp<RootStackParamList, 'DaysPerWeek'>;
};

const DaysPerWeekScreen: React.FC<DaysPerWeekScreenProps> = ({ navigation, route }) => {
  const { goal } = route.params;
  const [selectedDays, setSelectedDays] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedDays) {
      navigation.navigate('Equipment', { goal, daysPerWeek: selectedDays });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How many days per week?</Text>
      <Text style={styles.subtitle}>Choose your training frequency</Text>

      <View style={styles.optionsContainer}>
        {[3, 4, 5, 6].map((days) => (
          <TouchableOpacity
            key={days}
            style={[styles.optionCard, selectedDays === days && styles.optionCardActive]}
            onPress={() => setSelectedDays(days)}
          >
            <Text
              style={[styles.optionLabel, selectedDays === days && styles.optionLabelActive]}
            >
              {days} Days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedDays && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!selectedDays}
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
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  optionLabelActive: {
    color: '#007AFF',
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

export default DaysPerWeekScreen;
