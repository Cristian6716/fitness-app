import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface StatCardProps {
  icon?: string;
  value: string | number;
  label: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function StatCard({ icon, value, label, subtitle, style }: StatCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={[styles.card, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: 110,
    height: 90,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
    color: theme.colors.text,
  },
  value: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 1,
  },
});
