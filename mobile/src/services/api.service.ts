import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GenerateWorkoutRequest,
  WorkoutPlan,
  CompletedSession,
  LogSetRequest,
  CompleteSessionRequest,
  PlanStatsResponse,
  NewsResponse,
  NewsArticle,
} from '../types/api.types';

const API_BASE_URL = CONFIG.API_BASE_URL;
const TOKEN_KEY = '@fitness_app_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests automatically
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle errors globally
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.removeToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    await this.setToken(response.data.token);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    await this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async completeOnboarding(): Promise<void> {
    await this.api.post('/auth/complete-onboarding');
  }

  // Workout endpoints
  async generateWorkout(data: GenerateWorkoutRequest): Promise<WorkoutPlan> {
    const response = await this.api.post<WorkoutPlan>('/workouts/generate', data);
    return response.data;
  }

  async getWorkouts(): Promise<WorkoutPlan[]> {
    const response = await this.api.get<WorkoutPlan[]>('/workouts');
    return response.data;
  }

  async getWorkoutById(id: string): Promise<WorkoutPlan> {
    const response = await this.api.get<WorkoutPlan>(`/workouts/${id}`);
    return response.data;
  }

  async deleteWorkout(id: string): Promise<void> {
    await this.api.delete(`/workouts/${id}`);
  }

  async updateWorkoutStatus(id: string, status: 'active' | 'archived'): Promise<void> {
    await this.api.put(`/workouts/${id}/status`, { status });
  }

  async getPlanStats(planId: string, weeks: number = 4): Promise<PlanStatsResponse> {
    const response = await this.api.get<PlanStatsResponse>(`/workouts/${planId}/stats`, {
      params: { weeks },
    });
    return response.data;
  }

  async uploadWorkoutPlan(file: { uri: string; name: string; mimeType?: string }): Promise<{ parsedData: any; warnings?: string[] }> {
    console.log('📤 === UPLOAD WORKOUT PLAN START ===');
    console.log('📤 File:', { name: file.name, mimeType: file.mimeType, uri: file.uri.substring(0, 50) + '...' });

    const formData = new FormData();

    // Create file object for FormData
    const fileData: any = {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    };

    formData.append('file', fileData);
    console.log('📤 FormData created with file');

    // Create custom axios instance with multipart/form-data headers
    const token = await this.getToken();
    console.log('📤 Token retrieved:', token ? 'Yes' : 'No');

    const url = `${API_BASE_URL}/plans/upload`;
    console.log('📤 Upload URL:', url);

    // Upload with retry logic
    const maxRetries = 1;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`📤 Retry attempt ${attempt}/${maxRetries} after 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('📤 Sending request...');
        const response = await axios.post<{ success: boolean; message: string; parsedData: any; warnings?: string[] }>(
          url,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: token ? `Bearer ${token}` : '',
            },
            timeout: 180000, // 180 seconds (3 minutes) for large files and slow parsing
          }
        );

        console.log('📤 Response received');
        console.log('📤 Status:', response.status);
        console.log('📤 Data:', JSON.stringify(response.data, null, 2));
        console.log('📤 === UPLOAD WORKOUT PLAN END (SUCCESS) ===');

        // Backend returns { success, message, parsedData, warnings }
        return {
          parsedData: response.data.parsedData,
          warnings: response.data.warnings,
        };
      } catch (error: any) {
        lastError = error;

        // Check if it's a network error and we should retry
        const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED';
        const shouldRetry = isNetworkError && attempt < maxRetries;

        console.error('📤 === UPLOAD WORKOUT PLAN ERROR ===');
        console.error('📤 Attempt:', attempt + 1);
        console.error('📤 Error type:', error.constructor?.name);
        console.error('📤 Error message:', error.message);
        console.error('📤 Error code:', error.code);
        console.error('📤 Error response:', error.response?.data);
        console.error('📤 Error status:', error.response?.status);
        console.error('📤 Should retry:', shouldRetry);
        console.error('📤 ===================================');

        if (!shouldRetry) {
          throw error;
        }
      }
    }

    // If we get here, all retries failed
    console.error('📤 All retry attempts exhausted');
    throw lastError;
  }

  async confirmWorkoutPlan(planData: any): Promise<WorkoutPlan> {
    console.log('✅ === CONFIRM WORKOUT PLAN START ===');
    const response = await this.api.post<{ message: string; plan: WorkoutPlan }>('/plans/confirm', planData);
    console.log('✅ Plan confirmed:', response.data.plan.id);
    console.log('✅ === CONFIRM WORKOUT PLAN END ===');
    return response.data.plan;
  }

  // Session tracking endpoints
  async startSession(sessionId: string): Promise<CompletedSession> {
    const response = await this.api.post<CompletedSession>(`/sessions/${sessionId}/start`);
    return response.data;
  }

  async logSet(completedSessionId: string, data: LogSetRequest): Promise<void> {
    await this.api.post(`/sessions/${completedSessionId}/log-set`, data);
  }

  async completeSession(
    completedSessionId: string,
    data: CompleteSessionRequest
  ): Promise<CompletedSession> {
    const response = await this.api.post<CompletedSession>(
      `/sessions/${completedSessionId}/complete`,
      data
    );
    return response.data;
  }

  async getSessionHistory(sessionId: string): Promise<CompletedSession[]> {
    const response = await this.api.get<CompletedSession[]>(`/sessions/${sessionId}/history`);
    return response.data;
  }

  // Stats endpoints
  async getStats(): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    workoutsPerWeek: { week: string; count: number }[];
    lastWorkoutDate: string | null;
  }> {
    const response = await this.api.get('/stats');
    return response.data;
  }

  async getWeeklyStats(): Promise<{
    workoutsThisWeek: number;
    volumeThisWeek: number;
    lastWorkoutDate: string | null;
  }> {
    const response = await this.api.get('/stats/weekly');
    return response.data;
  }

  // News endpoints
  async getNews(limit: number = 20, offset: number = 0, category?: string): Promise<NewsResponse> {
    const params: any = { limit, offset };
    if (category) {
      params.category = category;
    }
    const response = await this.api.get<NewsResponse>('/news', { params });
    return response.data;
  }

  async getNewsById(id: string): Promise<NewsArticle> {
    const response = await this.api.get<NewsArticle>(`/news/${id}`);
    return response.data;
  }
}

export default new ApiService();
