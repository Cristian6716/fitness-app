import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type EquipmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Equipment'>;
  route: RouteProp<RootStackParamList, 'Equipment'>;
};

const equipmentOptions = [
  { id: 'gym', label: '✅ Palestra completa' },
  { id: 'home_gym', label: '✅ Home gym (bilanciere, pesi)' },
  { id: 'dumbbells', label: '✅ Solo manubri' },
  { id: 'bodyweight', label: '✅ Solo corpo libero' },
  { id: 'resistance_bands', label: '✅ Bande elastiche' },
  { id: 'kettlebell', label: '✅ Kettlebell' },
];

const EquipmentScreen: React.FC<EquipmentScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { personalInfo, goal, goalDetails, daysPerWeek, sessionDuration, scheduleNotes } = route.params;
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipmentDetails, setEquipmentDetails] = useState('');

  const toggleEquipment = (id: string) => {
    if (selectedEquipment.includes(id)) {
      setSelectedEquipment(selectedEquipment.filter((item) => item !== id));
    } else {
      setSelectedEquipment([...selectedEquipment, id]);
    }
  };

  const handleNext = () => {
    if (selectedEquipment.length > 0) {
      navigation.navigate('Experience', {
        ...personalInfo,
        goal,
        goalDetails,
        daysPerWeek,
        sessionDuration,
        scheduleNotes,
        equipment: selectedEquipment,
        equipmentDetails: equipmentDetails.trim() || undefined,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Text style={styles.title}>Dove ti alleni?</Text>
              <Text style={styles.subtitle}>Seleziona tutto ciò che hai (selezione multipla)</Text>

              <View style={styles.optionsContainer}>
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
              </View>

              <Text style={styles.sectionLabel}>Attrezzatura specifica (opzionale)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Es: ho leg press ma no hack squat"
                value={equipmentDetails}
                onChangeText={setEquipmentDetails}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Indietro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, selectedEquipment.length === 0 && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={selectedEquipment.length === 0}
          >
            <Text style={styles.buttonText}>Continua</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.fontSize.md,
    minHeight: 60,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  optionsContainer: {
    marginBottom: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm + theme.spacing.xs,
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm + theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  optionLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  optionLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm + theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default EquipmentScreen;
