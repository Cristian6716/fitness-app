import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type FirstTimeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirstTime'>;

type FirstTimeScreenProps = {
  navigation: FirstTimeScreenNavigationProp;
};

const FirstTimeScreen: React.FC<FirstTimeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Inizia il tuo percorso</Text>
          <Text style={styles.subtitle}>
            Scegli come iniziare con la tua programmazione
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Card 1 - Genera Piano AI */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PersonalInfo')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="sparkles" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Genera Piano con AI</Text>
            <Text style={styles.cardDescription}>
              Crea un programma personalizzato in base ai tuoi obiettivi
            </Text>
          </TouchableOpacity>

          {/* Card 2 - Importa Piano */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('FileUpload')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Importa Piano Esistente</Text>
            <Text style={styles.cardDescription}>
              Carica un programma da PDF, Excel o Word
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.skipButtonText}>Salta per ora</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  cardsContainer: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  skipButton: {
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    fontWeight: theme.fontWeight.medium,
  },
});

export default FirstTimeScreen;
