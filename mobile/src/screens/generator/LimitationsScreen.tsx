import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type LimitationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Limitations'>;
  route: RouteProp<RootStackParamList, 'Limitations'>;
};

const LimitationsScreen: React.FC<LimitationsScreenProps> = ({ navigation, route }) => {
  const params = route.params;
  const [hasLimitations, setHasLimitations] = useState<'yes' | 'no' | 'prefer_not' | null>(null);
  const [limitations, setLimitations] = useState('');

  const handleNext = () => {
    navigation.navigate('Advanced', {
      ...params,
      limitations: hasLimitations === 'yes' ? limitations.trim() : undefined,
    });
  };

  const handleSkip = () => {
    navigation.navigate('Advanced', { ...params });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Limitazioni Fisiche</Text>
      <Text style={styles.subtitle}>Hai infortuni o limitazioni fisiche? (opzionale)</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, hasLimitations === 'yes' && styles.optionButtonActive]}
          onPress={() => setHasLimitations('yes')}
        >
          <Text style={[styles.optionText, hasLimitations === 'yes' && styles.optionTextActive]}>
            Sì
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, hasLimitations === 'no' && styles.optionButtonActive]}
          onPress={() => setHasLimitations('no')}
        >
          <Text style={[styles.optionText, hasLimitations === 'no' && styles.optionTextActive]}>
            No
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, hasLimitations === 'prefer_not' && styles.optionButtonActive]}
          onPress={() => setHasLimitations('prefer_not')}
        >
          <Text style={[styles.optionText, hasLimitations === 'prefer_not' && styles.optionTextActive]}>
            Preferisco non rispondere
          </Text>
        </TouchableOpacity>
      </View>

      {hasLimitations === 'yes' && (
        <>
          <Text style={styles.sectionLabel}>Descrivi le tue limitazioni</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Es: dolore spalla destra, evito military press"
            value={limitations}
            onChangeText={setLimitations}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </>
      )}

      <Text style={styles.helper}>
        Questa informazione ci aiuterà a creare un programma sicuro per te.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Indietro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Salta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continua</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm + theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.fontSize.md,
    minHeight: 100,
    marginBottom: theme.spacing.md,
  },
  helper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  skipButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  skipButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default LimitationsScreen;
