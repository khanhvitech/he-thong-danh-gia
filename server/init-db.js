import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log('🔄 Đang khởi tạo database...');
    
    // Đọc file schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Thực thi schema
    await pool.query(schema);
    
    console.log('✅ Database đã được khởi tạo thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khởi tạo database:', error);
    process.exit(1);
  }
}

initDatabase();
