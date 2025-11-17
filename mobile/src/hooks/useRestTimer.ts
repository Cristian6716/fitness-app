import { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration, AppState, AppStateStatus } from 'react-native';
import { restTimerService, RestTimerConfig } from '../services/RestTimerService';
import * as Notifications from 'expo-notifications';

interface UseRestTimerReturn {
  isResting: boolean;
  restTimeRemaining: number;
  startRestTimer: (config: RestTimerConfig) => void;
  skipRest: () => void;
  pauseRest: () => void;
  resumeRest: () => void;
  isPaused: boolean;
}

export const useRestTimer = (): UseRestTimerReturn => {
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundStartTime = useRef<number | null>(null);

  /**
   * Clean up timer interval
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Complete rest timer
   */
  const completeRest = useCallback(async () => {
    clearTimer();
    setIsResting(false);
    setRestTimeRemaining(0);
    setIsPaused(false);
    setInitialDuration(0);
    await restTimerService.cancelRestTimer();

    // Vibration pattern: long-short-long
    Vibration.vibrate([0, 400, 200, 400]);
  }, [clearTimer]);

  /**
   * Start countdown timer
   */
  const startCountdown = useCallback((duration: number) => {
    clearTimer();
    setRestTimeRemaining(duration);

    timerRef.current = setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev <= 1) {
          completeRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, completeRest]);

  /**
   * Start rest timer
   */
  const startRestTimer = useCallback(async (config: RestTimerConfig) => {
    setIsResting(true);
    setIsPaused(false);
    setInitialDuration(config.duration);
    startCountdown(config.duration);

    // Schedule background notification
    await restTimerService.startRestTimer(config);

    // Light vibration feedback
    Vibration.vibrate(30);
  }, [startCountdown]);

  /**
   * Skip rest timer
   */
  const skipRest = useCallback(async () => {
    await completeRest();
    Vibration.vibrate(30);
  }, [completeRest]);

  /**
   * Pause rest timer
   */
  const pauseRest = useCallback(async () => {
    if (!isResting || isPaused) return;

    clearTimer();
    setIsPaused(true);
    await restTimerService.cancelRestTimer();
    Vibration.vibrate(30);
  }, [isResting, isPaused, clearTimer]);

  /**
   * Resume rest timer
   */
  const resumeRest = useCallback(async (config?: RestTimerConfig) => {
    if (!isResting || !isPaused) return;

    setIsPaused(false);
    startCountdown(restTimeRemaining);

    // Reschedule notification with remaining time
    if (config) {
      await restTimerService.startRestTimer({
        ...config,
        duration: restTimeRemaining,
      });
    }

    Vibration.vibrate(30);
  }, [isResting, isPaused, restTimeRemaining, startCountdown]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App goes to background
      if (
        appState.current.match(/active|foreground/) &&
        nextAppState === 'background' &&
        isResting &&
        !isPaused
      ) {
        backgroundStartTime.current = Date.now();
      }

      // App comes to foreground
      if (
        appState.current === 'background' &&
        nextAppState.match(/active|foreground/) &&
        isResting &&
        !isPaused &&
        backgroundStartTime.current
      ) {
        const timeInBackground = Math.floor((Date.now() - backgroundStartTime.current) / 1000);
        const newTimeRemaining = Math.max(0, restTimeRemaining - timeInBackground);

        if (newTimeRemaining <= 0) {
          completeRest();
        } else {
          setRestTimeRemaining(newTimeRemaining);
        }

        backgroundStartTime.current = null;
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isResting, isPaused, restTimeRemaining, completeRest]);

  /**
   * Handle notification responses (user taps notification)
   */
  useEffect(() => {
    const subscription = restTimerService.addNotificationResponseListener((response) => {
      if (response.notification.request.content.data?.type === 'rest_timer_complete') {
        completeRest();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [completeRest]);

  /**
   * Handle notifications received while app is in foreground
   */
  useEffect(() => {
    const subscription = restTimerService.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.type === 'rest_timer_complete') {
        completeRest();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [completeRest]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimer();
      restTimerService.cancelRestTimer();
    };
  }, [clearTimer]);

  return {
    isResting,
    restTimeRemaining,
    startRestTimer,
    skipRest,
    pauseRest,
    resumeRest,
    isPaused,
  };
};
