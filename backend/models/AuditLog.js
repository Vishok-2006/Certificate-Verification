const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadataJson: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditEvents' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = AuditLog;
