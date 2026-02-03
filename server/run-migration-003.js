// Script to run migration 003
import pool from './db.js';

async function runMigration() {
  try {
    console.log('Running migration 003...');
    
    // Add created_by column
    await pool.query(`
      ALTER TABLE question_templates 
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT NULL
    `);
    console.log('✓ Added created_by column');
    
    // Add last_modified_by column  
    await pool.query(`
      ALTER TABLE question_templates 
      ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT NULL
    `);
    console.log('✓ Added last_modified_by column');
    
    // Check columns
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'question_templates'
      ORDER BY ordinal_position
    `);
    console.log('\nCurrent columns:', result.rows.map(r => r.column_name));
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

runMigration();
