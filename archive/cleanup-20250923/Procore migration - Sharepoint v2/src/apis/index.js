import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../const/common';

export default function api({ baseURL = '', accessToken }) {
  const token =
    accessToken || localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  return axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json;odata=verbose',
      Accept: 'application/json;odata=verbose',
      Authorization: `Bearer ${token}`,
    },
    maxBodyLength: Infinity,
  });
}
