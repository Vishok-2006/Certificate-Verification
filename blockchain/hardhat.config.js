import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

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
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts,
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || '',
      accounts,
    },
  },
  paths: {
    artifacts: '../backend/artifacts',
  },
};

export default config;
