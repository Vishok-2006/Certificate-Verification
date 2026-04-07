const tableName = 'Users';

const normalizeTableNames = (tables) =>
  tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.TABLE_NAME));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = normalizeTableNames(await queryInterface.showAllTables());

    if (!tables.includes(tableName)) {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        role: {
          type: Sequelize.ENUM('admin', 'student'),
          allowNull: false,
          defaultValue: 'student',
        },
        registerNumber: {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      return;
    }

    const definition = await queryInterface.describeTable(tableName);
  },
};
