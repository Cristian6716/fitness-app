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
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { WorkoutPlan, TrainingSession } from '../../types/api.types';
import apiService from '../../services/api.service';

type PlanDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetails'>;
  route: RouteProp<RootStackParamList, 'PlanDetails'>;
};

const PlanDetailsScreen: React.FC<PlanDetailsScreenProps> = ({ navigation, route }) => {
  const { planId } = route.params;
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const data = await apiService.getWorkoutById(planId);
      setPlan(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plan');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionPress = (session: TrainingSession) => {
    navigation.navigate('Session', {
      sessionId: session.id,
      sessionName: session.name,
    });
  };

  const renderSession = ({ item }: { item: TrainingSession }) => (
    <TouchableOpacity style={styles.sessionCard} onPress={() => handleSessionPress(item)}>
      <View style={styles.sessionHeader}>
        <Text style={styles.dayNumber}>Day {item.dayNumber}</Text>
        <Text style={styles.exerciseCount}>{item.exercises.length} exercises</Text>
      </View>
      <Text style={styles.sessionName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Text>Plan not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDetail}>
          {plan.durationWeeks} weeks • {plan.trainingSessions.length} training sessions
        </Text>
        {Boolean(plan.aiGenerated) && <Text style={styles.aiBadge}>AI Generated</Text>}
      </View>

      <Text style={styles.sectionTitle}>Training Sessions</Text>

      <FlatList
        data={plan.trainingSessions}
        renderItem={renderSession}
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  aiBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#666',
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default PlanDetailsScreen;
