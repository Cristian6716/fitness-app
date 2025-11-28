import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type DaysPerWeekScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DaysPerWeek'>;
  route: RouteProp<RootStackParamList, 'DaysPerWeek'>;
};

const DaysPerWeekScreen: React.FC<DaysPerWeekScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { goal, personalInfo, goalDetails } = route.params;
  const [selectedDays, setSelectedDays] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedDays) {
      navigation.navigate('Equipment', {
        personalInfo,
        goal,
        goalDetails,
        daysPerWeek: selectedDays,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quanti giorni a settimana?</Text>
      <Text style={styles.subtitle}>Scegli la frequenza di allenamento</Text>

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
              {days} Giorni
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedDays && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!selectedDays}
      >
        <Text style={styles.buttonText}>Avanti</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
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
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionLabel: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  optionLabelActive: {
    color: theme.colors.primary,
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

export default DaysPerWeekScreen;
