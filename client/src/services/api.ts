import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = (window as any).__RUNTIME_CONFIG__?.REACT_APP_API_BASE_URL || 'http://localhost:3001';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const sessionId = this.getSessionId();
        if (sessionId) {
          config.headers['x-session-id'] = sessionId;
        }

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        // Only log actual API errors, not CORS/network errors during development
        if (error.response?.status && error.response.status !== 0) {
          console.error('API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.response?.data?.error?.message || error.message,
          });
        }

        // Handle auth errors
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        return Promise.reject(error);
      }
    );
  }

  private getSessionId(): string | null {
    // Try multiple sources for session ID to ensure compatibility
    // 1. First try localStorage (most reliable)
    let sessionId = localStorage.getItem('session_id');
    if (sessionId) return sessionId;

    // 2. Try sessionStorage (backup)
    sessionId = sessionStorage.getItem('session_id');
    if (sessionId) return sessionId;

    // 3. Try reading from cookies as fallback
    try {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      sessionId = cookies['session-id'] || cookies['sharepoint_session'] || cookies['session_id'];
      if (sessionId) {
        // Store it in localStorage for future use
        localStorage.setItem('session_id', sessionId);
        return sessionId;
      }
    } catch (error) {
      console.warn('Failed to read session from cookies:', error);
    }

    return null;
  }

  private setSessionId(sessionId: string): void {
    localStorage.setItem('session_id', sessionId);
  }

  private clearSessionId(): void {
    localStorage.removeItem('session_id');
  }

  private handleAuthError(): void {
    this.clearSessionId();
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Generic HTTP methods
  async get<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, { params });
  }

  async post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data);
  }

  async delete<T = any>(url: string): Promise<AxiosResponse<T>> {
    return this.client.delete(url);
  }

  async patch<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data);
  }

  // File upload
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // File download
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Auth methods
  async checkAuthStatus() {
    return this.get('/auth/status');
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearSessionId();
    }
  }

  // Set session from external source (e.g., after OAuth callback)
  setSession(sessionId: string): void {
    this.setSessionId(sessionId);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getSessionId();
  }
}

export const api = new ApiService();