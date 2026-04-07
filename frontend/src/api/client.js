import axios from 'axios';
import { appEnv } from '../config/env';

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export const buildFileUrl = (filePath) => (filePath ? `${appEnv.apiBaseUrl}/${filePath}` : null);
export const buildExplorerTxUrl = (txHash, chain = appEnv.defaultChain) => {
  const baseUrl = chain === 'polygon-amoy' ? appEnv.polygonExplorerBaseUrl : appEnv.explorerBaseUrl;
  return `${baseUrl}/tx/${txHash}`;
};
export const buildVerifyUrl = (certificateId) => `${appEnv.publicAppUrl}/verify/${certificateId}`;
