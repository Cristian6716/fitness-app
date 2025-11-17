import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface RestTimerConfig {
  duration: number; // seconds
  exerciseName: string;
  setNumber: number;
}

class RestTimerService {
  private currentNotificationId: string | null = null;

  /**
   * Request notification permissions
   * Must be called before scheduling notifications
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Rest Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9500',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Start a rest timer with notification
   */
  async startRestTimer(config: RestTimerConfig): Promise<void> {
    // Cancel any existing timer first
    await this.cancelRestTimer();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Riposo completato! ⏰',
          body: `Pronto per il set ${config.setNumber + 1} di ${config.exerciseName}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
          data: {
            type: 'rest_timer_complete',
            exerciseName: config.exerciseName,
            setNumber: config.setNumber,
          },
        },
        trigger: {
          seconds: config.duration,
          channelId: Platform.OS === 'android' ? 'rest-timer' : undefined,
        },
      });

      this.currentNotificationId = notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Cancel the current rest timer
   */
  async cancelRestTimer(): Promise<void> {
    if (this.currentNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(this.currentNotificationId);
      this.currentNotificationId = null;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.currentNotificationId = null;
  }

  /**
   * Get the current notification ID
   */
  getCurrentNotificationId(): string | null {
    return this.currentNotificationId;
  }

  /**
   * Check if a rest timer is currently active
   */
  hasActiveTimer(): boolean {
    return this.currentNotificationId !== null;
  }

  /**
   * Add a notification response listener
   * Called when user taps on notification
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add a notification received listener
   * Called when notification is received (app in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

// Singleton instance
export const restTimerService = new RestTimerService();
