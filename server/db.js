import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'he_thong_danh_gia',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Đã kết nối PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi PostgreSQL:', err);
});

export default pool;
