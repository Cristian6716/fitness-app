import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {user?.profile && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{user.profile.age} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight:</Text>
              <Text style={styles.value}>{user.profile.weight} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Height:</Text>
              <Text style={styles.value}>{user.profile.height} cm</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Fitness Level:</Text>
              <Text style={styles.value}>{user.profile.fitness_level}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  profileSection: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen;
