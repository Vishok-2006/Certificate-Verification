const stripTrailingSlash = (value) => value.replace(/\/$/, '');

export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME || 'CertiBlock',
  institutionName: import.meta.env.VITE_INSTITUTION_NAME || 'Northwind Institute of Technology',
  institutionTagline: import.meta.env.VITE_INSTITUTION_TAGLINE || 'Trusted digital credentials for modern campuses',
  apiBaseUrl: stripTrailingSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
  publicAppUrl: stripTrailingSlash(import.meta.env.VITE_PUBLIC_APP_URL || 'http://localhost:5173'),
  explorerBaseUrl: stripTrailingSlash(import.meta.env.VITE_ETHERSCAN_BASE_URL || 'https://sepolia.etherscan.io'),
  polygonExplorerBaseUrl: stripTrailingSlash(import.meta.env.VITE_POLYGON_EXPLORER_BASE_URL || 'https://amoy.polygonscan.com'),
  defaultChain: import.meta.env.VITE_DEFAULT_CHAIN || 'sepolia',
};
