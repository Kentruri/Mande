const { Pool } = require('pg');

const pool = new Pool({
    //BASE DE DATOS LOCAL
    // host: 'localhost',
    // user: 'postgres',
    // password: '123',
    // database: 'mande',
    // port: '5432'

    //BASE DE DATOS CLEVER CLOUD
    host: 'b7dlzbcosixp4ritgqny-postgresql.services.clever-cloud.com',
    user: 'ulno8vkkxiz86dqlu6g3',
    password: 'N7FtfQfgxYDwgcBuTRZQ',
    database: 'b7dlzbcosixp4ritgqny',
    port: '5432'
});

module.exports = pool;
