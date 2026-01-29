import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'he_thong_danh_gia',
  password: process.env.DB_PASSWORD,
  port: 5432
});

async function addSelectionColumns() {
  try {
    console.log('Adding selection_question and min_selections columns...');
    
    // Thêm cột selection_question
    await pool.query(`
      ALTER TABLE question_templates 
      ADD COLUMN IF NOT EXISTS selection_question TEXT
    `);
    console.log('✓ Đã thêm cột selection_question');
    
    // Thêm cột min_selections
    await pool.query(`
      ALTER TABLE question_templates 
      ADD COLUMN IF NOT EXISTS min_selections INTEGER DEFAULT 1
    `);
    console.log('✓ Đã thêm cột min_selections');
    
    // Cập nhật giá trị mặc định cho template BLD
    await pool.query(`
      UPDATE question_templates 
      SET selection_question = 'Anh/Chị đã có đủ trải nghiệm làm việc hoặc tương tác để chia sẻ góc nhìn với những lãnh đạo nào dưới đây?',
          min_selections = 2
      WHERE type = 'bld' AND selection_question IS NULL
    `);
    console.log('✓ Đã cập nhật selection_question cho template BLD');
    
    // Kiểm tra lại
    const check = await pool.query('SELECT id, name, type, selection_question, min_selections FROM question_templates');
    console.log('\nAll templates:');
    check.rows.forEach(r => console.log(`  - ${r.id}: ${r.name} [type: ${r.type}] [minSelections: ${r.min_selections}]`));

    pool.end();
    console.log('\n✓ Hoàn thành!');
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

addSelectionColumns();
