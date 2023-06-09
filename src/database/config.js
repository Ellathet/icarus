/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const sequelizeDbName = process.env['DB_NAME'];
const sequelizeDbUser = process.env['DB_USERNAME'];
const sequelizeDbHost = process.env['DB_HOST'];
const sequelizeDbDialect = 'postgres';
const sequelizeDbPassword = process.env['DB_PASSWORD'];

module.exports = {
  username: sequelizeDbUser,
  port: 5432,
  password: sequelizeDbPassword,
  database: sequelizeDbName,
  host: sequelizeDbHost,
  dialect: sequelizeDbDialect,
};
