require('dotenv').config();

const trimValue = (value) => (typeof value === 'string' ? value.trim() : value);

const readString = (name, fallback = '') => {
  const value = trimValue(process.env[name]);
  return value || fallback;
};

const readBoolean = (name, fallback = false) => {
  const value = readString(name, '');
  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const readNumber = (name, fallback) => {
  const rawValue = readString(name, '');
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative number`);
  }

  return parsed;
};

const env = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 5000),
  appUrl: readString('APP_URL', 'http://localhost:5000'),
  frontendUrl: readString('FRONTEND_URL', 'http://localhost:5173'),
  publicVerifyBaseUrl: readString('PUBLIC_VERIFY_BASE_URL', 'http://localhost:5173/verify'),
  corsOrigins: readString('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: readString('JWT_SECRET', ''),
  jwtExpiresIn: readString('JWT_EXPIRES_IN', '1d'),
  encryptionKey: readString('ENCRYPTION_KEY', ''),
  adminRegistrationKey: readString('ADMIN_REGISTRATION_KEY', ''),

  databaseUrl: readString('DATABASE_URL', ''),
  dbDialect: readString('DB_DIALECT', 'postgres'),
  dbHost: readString('DB_HOST', '127.0.0.1'),
  dbPort: readNumber('DB_PORT', 5432),
  dbUser: readString('DB_USER', 'postgres'),
  dbPass: readString('DB_PASS', ''),
  dbName: readString('DB_NAME', 'certiblock'),
  dbSsl: readBoolean('DB_SSL', false),

  rpcUrl: readString('RPC_URL', ''),
  privateKey: readString('PRIVATE_KEY', ''),
  contractAddress: readString('CONTRACT_ADDRESS', ''),
  polygonContractAddress: readString('POLYGON_CONTRACT_ADDRESS', ''),
  defaultChain: readString('DEFAULT_CHAIN', 'sepolia'),
  explorerBaseUrl: readString('EXPLORER_BASE_URL', 'https://sepolia.etherscan.io'),
  polygonExplorerBaseUrl: readString('POLYGON_EXPLORER_BASE_URL', 'https://amoy.polygonscan.com'),

  pinataJwt: readString('PINATA_JWT', ''),
  pinataGateway: readString('PINATA_GATEWAY', 'https://gateway.pinata.cloud/ipfs'),
  web3StorageToken: readString('WEB3_STORAGE_TOKEN', ''),

  smtpHost: readString('SMTP_HOST', ''),
  smtpPort: readNumber('SMTP_PORT', 587),
  smtpUser: readString('SMTP_USER', ''),
  smtpPass: readString('SMTP_PASS', ''),
  smtpFrom: readString('SMTP_FROM', 'no-reply@certiblock.local'),
  smtpSecure: readBoolean('SMTP_SECURE', false),

  maxUploadSizeMb: readNumber('MAX_UPLOAD_SIZE_MB', 10),
  authRateLimitMax: readNumber('AUTH_RATE_LIMIT_MAX', 20),
  apiRateLimitMax: readNumber('API_RATE_LIMIT_MAX', 120),
  verificationRateLimitMax: readNumber('VERIFICATION_RATE_LIMIT_MAX', 60),
};

env.maxUploadSizeBytes = env.maxUploadSizeMb * 1024 * 1024;

const ensureEnv = (keys) => {
  const missingKeys = keys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
};

module.exports = { env, ensureEnv };
