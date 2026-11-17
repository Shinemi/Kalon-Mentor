'use strict'

const pg = require('pg')
const { Pool } = pg
require('dotenv').config()
const connectionString = process.env.DATABASE_URI
const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
    query_timeout: 10000,
})

const query = (text, params) => {
    return pool.query(text, params)
}

module.exports = { query, pool }
