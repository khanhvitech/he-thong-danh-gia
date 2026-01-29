import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'he_thong_danh_gia',
  password: process.env.DB_PASSWORD,
  port: 5432
});

async function checkTemplates() {
  try {
    const result = await pool.query('SELECT id, name, type, subjects, selection_question, min_selections FROM question_templates');
    
    result.rows.forEach(t => {
      console.log('\n=== ' + t.id + ' ===');
      console.log('Name:', t.name);
      console.log('Type:', t.type);
      console.log('Selection Question:', t.selection_question);
      console.log('Min Selections:', t.min_selections);
      console.log('Subjects count:', t.subjects ? t.subjects.length : 0);
      if (t.subjects && t.subjects.length > 0) {
        console.log('Subjects:');
        t.subjects.forEach(s => console.log('  -', s.name, '| position:', s.position, '| department:', s.department));
      }
    });

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

checkTemplates();
