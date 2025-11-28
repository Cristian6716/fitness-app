import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';

type PersonalInfoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PersonalInfo'>;
};

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const handleNext = () => {
    // Validazione
    if (!age || !weight || !height || !gender) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || ageNum < 15 || ageNum > 100) {
      Alert.alert('Errore', 'Inserisci un\'età valida (15-100 anni)');
      return;
    }

    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      Alert.alert('Errore', 'Inserisci un peso valido (30-300 kg)');
      return;
    }

    if (isNaN(heightNum) || heightNum < 120 || heightNum > 250) {
      Alert.alert('Errore', 'Inserisci un\'altezza valida (120-250 cm)');
      return;
    }

    navigation.navigate('GoalSelection', {
      personalInfo: {
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        gender,
      },
    });
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
              <Text style={styles.title}>Dati Personali</Text>
              <Text style={styles.subtitle}>Iniziamo con alcune informazioni di base</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Età *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Es: 25"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Peso (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Es: 70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Altezza (cm) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Es: 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Sesso *</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                      Maschio
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                      Femmina
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.helper}>* Campi obbligatori</Text>

              <GradientButton
                title="Continua"
                onPress={handleNext}
                disabled={!age || !weight || !height || !gender}
                style={styles.button}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
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
    paddingBottom: theme.spacing.xxl,
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
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  genderText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  helper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  button: {
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

export default PersonalInfoScreen;
