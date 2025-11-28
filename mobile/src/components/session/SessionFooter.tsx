import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface SessionFooterProps {
  // Rest timer state
  isResting: boolean;
  restTimeRemaining: number;
  onSkipRest: () => void;

  // Session controls
  onCompleteSession: () => void;
  onPauseSession: () => void;
  sessionStatus: 'not_started' | 'in_progress' | 'paused';
  isCompletingSession?: boolean;
}

const SessionFooter: React.FC<SessionFooterProps> = ({
  isResting,
  restTimeRemaining,
  onSkipRest,
  onCompleteSession,
  onPauseSession,
  sessionStatus,
  isCompletingSession = false,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animate rest timer appearance
  useEffect(() => {
    if (isResting) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isResting, slideAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    Vibration.vibrate(30);
    onPauseSession();
  };

  const handleCompleteSession = () => {
    Vibration.vibrate(50);
    onCompleteSession();
  };

  const handleSkipRest = () => {
    Vibration.vibrate(30);
    onSkipRest();
  };

  if (isResting) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.restTimerContainer,
          {
            paddingBottom: insets.bottom || theme.spacing.md,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.restTimerContent}>
          <View style={styles.restTimerLeft}>
            <Text style={styles.restLabel}>Riposo</Text>
            <Text style={styles.restCountdown}>{formatTime(restTimeRemaining)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleSkipRest}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Salta Riposo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.normalContainer,
        { paddingBottom: insets.bottom || theme.spacing.md },
      ]}
    >
      {/* Complete Session Button */}
      <TouchableOpacity
        style={[
          styles.completeButton,
          isCompletingSession && styles.completeButtonDisabled,
        ]}
        onPress={handleCompleteSession}
        disabled={isCompletingSession || sessionStatus === 'not_started'}
        activeOpacity={0.8}
      >
        <Text style={styles.completeButtonText}>
          {isCompletingSession ? 'Completamento...' : 'Completa Allenamento'}
        </Text>
      </TouchableOpacity>

      {/* Pause/Resume Button */}
      {sessionStatus !== 'not_started' && (
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handlePauseResume}
          activeOpacity={0.7}
        >
          <Text style={styles.pauseButtonText}>
            {sessionStatus === 'paused' ? 'Riprendi' : 'Pausa'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },

  // Normal State
  normalContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
  },
  completeButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  pauseButton: {
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },

  // Rest Timer State
  restTimerContainer: {
    backgroundColor: '#FFA500',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  restTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restTimerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  restLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  restCountdown: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    letterSpacing: 2,
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    textDecorationLine: 'underline',
  },
});

export default SessionFooter;
