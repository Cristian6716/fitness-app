import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { WorkoutPlan } from '../../types/api.types';
import apiService from '../../services/api.service';

type PlansScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Plans'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type PlansScreenProps = {
  navigation: PlansScreenNavigationProp;
};

const PlansScreen: React.FC<PlansScreenProps> = ({ navigation }) => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadPlans();
    }, [])
  );

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getWorkouts();
      setPlans(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plans');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlan = ({ item }: { item: WorkoutPlan }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate('PlanDetails', { planId: item.id })}
    >
      <Text style={styles.planName}>{item.name}</Text>
      <Text style={styles.planDetail}>
        {item.durationWeeks} weeks • {item.trainingSessions.length} sessions
      </Text>
      {Boolean(item.aiGenerated) && <Text style={styles.aiBadge}>AI Generated</Text>}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No workout plans yet</Text>
        <Text style={styles.emptySubtext}>Generate your first plan from the Home tab</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        renderItem={renderPlan}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  planDetail: {
    fontSize: 14,
    color: '#666',
  },
  aiBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PlansScreen;
