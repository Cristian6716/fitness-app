import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { RecentSession } from '../../types/api.types';

interface RecentSessionItemProps {
  session: RecentSession;
  formatRelativeTime: (date: string) => string;
}

export function RecentSessionItem({ session, formatRelativeTime }: RecentSessionItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="fitness" size={20} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {session.sessionName}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {formatRelativeTime(session.completedAt)}
          </Text>
          <Text style={styles.metaDot}> • </Text>
          <Text style={styles.metaText}>
            {session.duration ? `${session.duration}min` : 'N/A'}
          </Text>
          <Text style={styles.metaDot}> • </Text>
          <Text style={styles.metaText}>{session.volume}kg</Text>
        </View>
      </View>

      {session.rating && (
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFB800" />
          <Text style={styles.ratingText}>{session.rating}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFB800',
    marginLeft: 2,
  },
});
