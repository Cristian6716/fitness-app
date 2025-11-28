import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeaderProfileButton } from './HeaderProfileButton';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';

interface CustomHeaderProps {
  title: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <HeaderProfileButton />
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 36,
    paddingBottom: theme.spacing.sm + 4,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
