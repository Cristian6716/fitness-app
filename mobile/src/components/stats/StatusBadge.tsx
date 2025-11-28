import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface StatusBadgeProps {
  text: string;
  color: string;
}

export function StatusBadge({ text, color }: StatusBadgeProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
});
