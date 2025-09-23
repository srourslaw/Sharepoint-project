import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../const/common';

const spAxios = axios.create();

spAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    const { accessToken } = JSON.parse(token);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

export { spAxios };
