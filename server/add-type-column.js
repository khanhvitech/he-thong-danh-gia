// Thêm cột type vào bảng question_templates
import pool from './db.js';

async function addTypeColumn() {
  try {
    await pool.query('ALTER TABLE question_templates ADD COLUMN IF NOT EXISTS type VARCHAR(50)');
    console.log('✓ Đã thêm cột type vào question_templates');
    
    // Cập nhật các template cũ có type = bld (dựa vào dữ liệu subjects)
    await pool.query(`
      UPDATE question_templates 
      SET type = 'bld' 
      WHERE type IS NULL 
      AND subjects::text LIKE '%Ban Giám Đốc%'
    `);
    console.log('✓ Cập nhật type cho các template BLD cũ');
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

addTypeColumn();
