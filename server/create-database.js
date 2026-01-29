// Script để tạo database nếu chưa tồn tại
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const dbName = process.env.DB_NAME || 'he_thong_danh_gia';

// Kết nối đến database postgres mặc định
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Kết nối đến database mặc định
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
  console.log('🚀 Kiểm tra và tạo database...');
  
  try {
    // Kiểm tra database đã tồn tại chưa
    const checkResult = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✓ Database "${dbName}" đã tồn tại`);
    } else {
      // Tạo database mới
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Đã tạo database "${dbName}"`);
    }
    
    console.log('✅ Hoàn tất!');
    console.log('👉 Tiếp theo, chạy: node init-db.js để tạo các bảng');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

createDatabase();
