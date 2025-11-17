import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

interface SessionHeaderProps {
  sessionName: string;
  elapsedSeconds: number;
  onBack: () => void;
  onEdit: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionName,
  elapsedSeconds,
  onBack,
  onEdit,
}) => {
  const insets = useSafeAreaInsets();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    Vibration.vibrate(30);
    onBack();
  };

  const handleEdit = () => {
    Vibration.vibrate(30);
    onEdit();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top || theme.spacing.md },
      ]}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {sessionName}
          </Text>
          <Text style={styles.elapsedTime}>{formatTime(elapsedSeconds)}</Text>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 60,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.text,
  },
  editIcon: {
    fontSize: 24,
    color: theme.colors.text,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sessionName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  elapsedTime: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});

export default SessionHeader;
