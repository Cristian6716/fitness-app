import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GenerateWorkoutRequest,
  WorkoutPlan,
  CompletedSession,
  LogSetRequest,
  CompleteSessionRequest,
} from '../types/api.types';

const API_BASE_URL = 'http://192.168.1.14:3000/api';
const TOKEN_KEY = '@fitness_app_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
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
}

export default new ApiService();
