import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../const/common';

const dmsAxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_DMS_API_URL,
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

dmsAxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    const { accessToken, idToken } = JSON.parse(token);

    if (accessToken && idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
      config.headers['X-Access-Token'] = accessToken;
    }
  }
  return config;
});

export { dmsAxiosInstance };
