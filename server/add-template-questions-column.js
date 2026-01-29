// Script để thêm cột template_questions vào database
import pool from './db.js';

async function migrate() {
  console.log('🚀 Bắt đầu migration...');
  
  try {
    // Kiểm tra cột đã tồn tại chưa
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'question_templates' 
      AND column_name = 'template_questions'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✓ Cột template_questions đã tồn tại');
    } else {
      // Thêm cột mới
      await pool.query(`
        ALTER TABLE question_templates 
        ADD COLUMN template_questions JSONB DEFAULT '[]'
      `);
      console.log('✓ Đã thêm cột template_questions');
    }
    
    console.log('✅ Migration hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
