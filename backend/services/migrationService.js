const fs = require('fs');
const path = require('path');
const { QueryTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const migrationsDir = path.join(__dirname, '..', 'migrations');

const ensureMigrationsTable = async () => {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS Migrations (
      name VARCHAR(255) PRIMARY KEY,
      runAt DATETIME NOT NULL
    )`
  );
};

const getAppliedMigrations = async () => {
  const rows = await sequelize.query('SELECT name FROM Migrations', {
    type: QueryTypes.SELECT,
  });

  return new Set(rows.map((row) => row.name));
};

const runMigrations = async () => {
  await ensureMigrationsTable();

  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.js')).sort();
  const queryInterface = sequelize.getQueryInterface();

  for (const migrationFile of migrationFiles) {
    if (appliedMigrations.has(migrationFile)) {
      continue;
    }

    const migration = require(path.join(migrationsDir, migrationFile));
    await migration.up(queryInterface, Sequelize);
    await sequelize.query('INSERT INTO Migrations (name, runAt) VALUES (:name, :runAt)', {
      replacements: { name: migrationFile, runAt: new Date() },
      type: QueryTypes.INSERT,
    });
  }
};

module.exports = { runMigrations };
