import mysql from 'mysql2/promise'

// Create a singleton pool to reuse across requests in dev
let pool

export async function db() {
  if (!pool) {
    const {
      DB_HOST = 'localhost',
      DB_NAME = '',
      DB_USER = '',
      DB_PASS = '',
      DB_PORT = '3306',
    } = process.env

    try {
      pool = mysql.createPool({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
        connectionLimit: 10,
        charset: 'utf8mb4_unicode_ci',
        // Add timeout and retry options
        acquireTimeout: 60000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      })
    } catch (error) {
      console.error('Failed to create database pool:', error)
      throw new Error('Database connection failed')
    }
  }
  return pool
}

export async function query(sql, params = []) {
  try {
    const connection = await db()
    const [rows] = await connection.execute(sql, params)
    return rows
  } catch (error) {
    console.error('Database query failed:', error)
    throw error
  }
}
