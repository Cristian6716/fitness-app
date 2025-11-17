import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';
import { theme } from '../constants/theme';

export const HeaderProfileButton: React.FC = () => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const getInitials = () => {
    if (!user?.email) return '?';
    const email = user.email;
    // Get first letter of email
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setModalVisible(true)}
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

      <ProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
