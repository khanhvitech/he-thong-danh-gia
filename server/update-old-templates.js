// Script to update old templates with default created_by
import pool from './db.js';

async function updateOldTemplates() {
  try {
    const result = await pool.query(`
      UPDATE question_templates 
      SET created_by = 'Quản trị viên', last_modified_by = 'Quản trị viên' 
      WHERE created_by IS NULL
    `);
    console.log('Updated', result.rowCount, 'rows with default creator');
    
    // Show updated data
    const templates = await pool.query(`
      SELECT name, created_by, last_modified_by FROM question_templates
    `);
    console.log('\nTemplates:');
    templates.rows.forEach(t => {
      console.log(`- ${t.name}: created by "${t.created_by}", modified by "${t.last_modified_by}"`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

updateOldTemplates();
