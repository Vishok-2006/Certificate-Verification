const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Certificate = sequelize.define(
  'Certificate',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    certificateId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientIdentifier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientEmailEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    course: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    institutionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    issuerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certificateHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    metadataDigest: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadataJson: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ipfsCid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipfsUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileMimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qrCode: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    txHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contractAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    chain: {
      type: DataTypes.ENUM('sepolia', 'polygon-amoy'),
      allowNull: false,
      defaultValue: 'sepolia',
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'failed', 'revoked'),
      allowNull: false,
      defaultValue: 'draft',
    },
    verificationCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fraudScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fraudFlags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

User.hasMany(Certificate, { foreignKey: 'issuedByUserId', as: 'issuedCertificates' });
Certificate.belongsTo(User, { foreignKey: 'issuedByUserId', as: 'issuer' });
User.hasMany(Certificate, { foreignKey: 'revokedByUserId', as: 'revokedCertificates' });
Certificate.belongsTo(User, { foreignKey: 'revokedByUserId', as: 'revoker' });

module.exports = Certificate;
