const tableName = 'Certificates';

const normalizeTableNames = (tables) =>
  tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.TABLE_NAME));

const addColumnIfMissing = async (queryInterface, Sequelize, definition, columnName, columnDefinition) => {
  if (!definition[columnName]) {
    await queryInterface.addColumn(tableName, columnName, columnDefinition);
  }
};

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
        certificateId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        studentName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        registerNumber: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        course: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        issueDate: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        certificateHash: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        pdfUrl: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        qrCode: {
          type: Sequelize.TEXT('long'),
          allowNull: true,
        },
        txHash: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('pending_chain', 'issued', 'failed', 'revoked'),
          allowNull: false,
          defaultValue: 'pending_chain',
        },
        verificationCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        lastError: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        revokedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        issuedByUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
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

    await queryInterface.changeColumn(tableName, 'status', {
      type: Sequelize.ENUM('pending_chain', 'issued', 'failed', 'revoked'),
      allowNull: false,
      defaultValue: 'pending_chain',
    });

    await addColumnIfMissing(queryInterface, Sequelize, definition, 'verificationCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await addColumnIfMissing(queryInterface, Sequelize, definition, 'lastError', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, definition, 'revokedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
