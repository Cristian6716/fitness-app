import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert('Disconnetti', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Disconnetti',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload user data logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilo</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.joinDate}>Membro dal 2024</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.profile?.weight || '-'}</Text>
              <Text style={styles.statLabel}>Kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.profile?.height || '-'}</Text>
              <Text style={styles.statLabel}>cm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.profile?.age || '-'}</Text>
              <Text style={styles.statLabel}>Anni</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>I Tuoi Dati</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Measurements')}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="body-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Misure Corporee</Text>
            <Text style={styles.menuSubtitle}>Traccia peso e circonferenze</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Statistics')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="stats-chart-outline" size={24} color="#2E7D32" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Statistiche Allenamento</Text>
            <Text style={styles.menuSubtitle}>Volume, frequenza e progressi</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Impostazioni</Text>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconContainer, { backgroundColor: mode === 'dark' ? '#333' : '#ECEFF1' }]}>
            <Ionicons name={mode === 'dark' ? "moon" : "moon-outline"} size={24} color={mode === 'dark' ? '#FFF' : "#455A64"} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Tema Scuro</Text>
            <Text style={styles.menuSubtitle}>{mode === 'dark' ? 'Attivo' : 'Disattivato'}</Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor={theme.colors.white}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  email: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.borderLight,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
