const Database = require('./database.js');
const psqlite3 = require('./psqlite3.js');
const {sqlite3, Statement} = psqlite3;

module.exports = {
	sqlite3, //Для доступа к константам
	psqlite3, //Для доступа к базовым классам, если захочется от них наследоваться
	Statement, 
	Database
};