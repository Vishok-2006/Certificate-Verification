const { Sequelize } = require('sequelize');
const { env } = require('./env');

const sharedConfig = {
  dialect: env.dbDialect,
  logging: false,
  dialectOptions: env.dbSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
};

const sequelize = env.databaseUrl
  ? new Sequelize(env.databaseUrl, sharedConfig)
  : new Sequelize(env.dbName, env.dbUser, env.dbPass, {
      ...sharedConfig,
      host: env.dbHost,
      port: env.dbPort,
    });

module.exports = sequelize;
