import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, logout } = useAuth();

  console.log('ProfileModal - User data:', user);

  const handleLogout = () => {
    Alert.alert('Disconnetti', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Disconnetti',
        style: 'destructive',
        onPress: () => {
          logout();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profilo</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.profileSection}>
                <Text style={styles.email}>{user?.email || 'Email non disponibile'}</Text>

                {user?.profile ? (
                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Età:</Text>
                      <Text style={styles.value}>{user.profile.age} anni</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Peso:</Text>
                      <Text style={styles.value}>{user.profile.weight} kg</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Altezza:</Text>
                      <Text style={styles.value}>{user.profile.height} cm</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Livello Fitness:</Text>
                      <Text style={styles.value}>{user.profile.fitness_level}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>Profilo non disponibile</Text>
                )}
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Disconnetti</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    minHeight: 400,
    maxHeight: '80%',
  },
  safeArea: {
    paddingTop: theme.spacing.md,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  profileSection: {
    marginBottom: theme.spacing.xl,
  },
  email: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  noDataText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  infoContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  label: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});
