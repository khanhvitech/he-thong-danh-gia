import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'he_thong_danh_gia',
  password: process.env.DB_PASSWORD,
  port: 5432
});

async function updateTypes() {
  try {
    // Cập nhật template nhân viên
    const result = await pool.query(
      "UPDATE question_templates SET type = 'nhan-vien' WHERE id = 'template-1769680786903'"
    );
    console.log('Updated template-1769680786903 to nhan-vien:', result.rowCount, 'row(s)');

    // Kiểm tra lại
    const check = await pool.query('SELECT id, name, type FROM question_templates');
    console.log('\nAll templates:');
    check.rows.forEach(r => console.log(`  - ${r.id}: ${r.name} [type: ${r.type}]`));

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

updateTypes();
