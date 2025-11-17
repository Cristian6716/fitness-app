import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { theme } from '../../constants/theme';
import ExercisePreviewRow from './ExercisePreviewRow';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
}

interface SessionAccordionItemProps {
  sessionNumber: number;
  name: string;
  exercises: Exercise[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void; // Callback per bottone modifica
}

const SessionAccordionItem: React.FC<SessionAccordionItemProps> = ({
  sessionNumber,
  name,
  exercises,
  isExpanded,
  onToggle,
  onEdit,
}) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{sessionNumber}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.sessionName}>{name}</Text>
            <Text style={styles.exerciseCount}>
              {exercises.length} eserciz{exercises.length === 1 ? 'io' : 'i'}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Text style={styles.chevron}>▼</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.body}>
          {/* Session header with edit button */}
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedTitle}>{name}</Text>
            {onEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.editButtonText}>✏️ Modifica</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Exercises list */}
          {exercises.map((exercise, index) => (
            <ExercisePreviewRow
              key={index}
              name={exercise.name}
              sets={exercise.sets}
              reps={exercise.reps}
              weight={exercise.weight}
              restSeconds={exercise.restSeconds}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    minHeight: 76,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  exerciseCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  body: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  expandedTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  editButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default SessionAccordionItem;
