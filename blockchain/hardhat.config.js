import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, './.env');
dotenv.config({ path: envPath });

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL?.trim();
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL?.trim();
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY?.trim();

if (!POLYGON_AMOY_RPC_URL) {
  throw new Error('Missing required environment variable: POLYGON_AMOY_RPC_URL');
}

if (!PRIVATE_KEY) {
  throw new Error('Missing required environment variable: DEPLOYER_PRIVATE_KEY');
}

const accounts = [PRIVATE_KEY];

console.log('Hardhat config loaded. Networks available: amoy, polygonAmoy, sepolia');
console.log(`POLYGON_AMOY_RPC_URL=${POLYGON_AMOY_RPC_URL ? 'configured' : 'missing'}`);
console.log(`SEPOLIA_RPC_URL=${SEPOLIA_RPC_URL ? 'configured' : 'missing'}`);

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: '0.8.20',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || '',
      accounts,
    },
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts,
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts,
    },
  },
  paths: {
    artifacts: '../backend/artifacts',
  },
};

export default config;
