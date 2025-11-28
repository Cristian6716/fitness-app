import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';

export const HeaderProfileButton: React.FC = () => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const getInitials = () => {
    if (!user?.email) return '?';
    const email = user.email;
    // Get first letter of email
    return email.charAt(0).toUpperCase();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Profile')}
    >
      <LinearGradient
        colors={theme.colors.gradientPrimary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.initials}>{getInitials()}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  initials: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
  },
});
