import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EquipmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Equipment'>;
  route: RouteProp<RootStackParamList, 'Equipment'>;
};

const equipmentOptions = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'machines', label: 'Machines' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
];

const EquipmentScreen: React.FC<EquipmentScreenProps> = ({ navigation, route }) => {
  const { goal, daysPerWeek } = route.params;
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const toggleEquipment = (id: string) => {
    if (selectedEquipment.includes(id)) {
      setSelectedEquipment(selectedEquipment.filter((item) => item !== id));
    } else {
      setSelectedEquipment([...selectedEquipment, id]);
    }
  };

  const handleNext = () => {
    if (selectedEquipment.length > 0) {
      navigation.navigate('Experience', { goal, daysPerWeek, equipment: selectedEquipment });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Equipment</Text>
      <Text style={styles.subtitle}>Select all that apply (multi-select)</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.optionsContainer}>
        {equipmentOptions.map((equipment) => (
          <TouchableOpacity
            key={equipment.id}
            style={[
              styles.optionCard,
              selectedEquipment.includes(equipment.id) && styles.optionCardActive,
            ]}
            onPress={() => toggleEquipment(equipment.id)}
          >
            <View style={styles.checkbox}>
              {selectedEquipment.includes(equipment.id) && <View style={styles.checkboxInner} />}
            </View>
            <Text
              style={[
                styles.optionLabel,
                selectedEquipment.includes(equipment.id) && styles.optionLabelActive,
              ]}
            >
              {equipment.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, selectedEquipment.length === 0 && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={selectedEquipment.length === 0}
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
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  optionLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
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

export default EquipmentScreen;
