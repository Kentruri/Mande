const {Pool} = require('pg');
const {database}=require('./keys');

const pool = new Pool(database);

module.exports = pool;
    