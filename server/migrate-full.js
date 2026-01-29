// Script migration hoàn chỉnh: Tạo database, tables và import dữ liệu từ JSON
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const dbName = process.env.DB_NAME || 'he_thong_danh_gia';
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

// Step 1: Tạo database
async function createDatabase() {
  const pool = new Pool({ ...dbConfig, database: 'postgres' });
  
  try {
    const checkResult = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✓ Database "${dbName}" đã tồn tại`);
    } else {
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Đã tạo database "${dbName}"`);
    }
  } finally {
    await pool.end();
  }
}

// Step 2: Tạo các bảng
async function createTables() {
  const pool = new Pool({ ...dbConfig, database: dbName });
  
  try {
    // Tạo bảng question_templates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE,
        description TEXT,
        roles JSONB DEFAULT '[]',
        questions JSONB DEFAULT '[]',
        subjects JSONB DEFAULT '[]',
        subject_questions JSONB DEFAULT '[]',
        template_questions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tạo bảng question_templates');

    // Tạo bảng evaluation_sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        evaluator_email VARCHAR(255) NOT NULL,
        evaluator_name VARCHAR(255) NOT NULL,
        deadline TIMESTAMP NOT NULL,
        subjects JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        link TEXT,
        token VARCHAR(255) UNIQUE
      )
    `);
    console.log('✓ Tạo bảng evaluation_sessions');

    // Tạo bảng evaluation_responses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_responses (
        id VARCHAR(255) PRIMARY KEY,
        template_id VARCHAR(255),
        session_id VARCHAR(255) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
        department VARCHAR(255),
        selected_subjects JSONB DEFAULT '[]',
        answers JSONB DEFAULT '{}',
        subject_details JSONB DEFAULT '[]',
        evaluator_name VARCHAR(255),
        evaluator_email VARCHAR(255),
        subject_evaluations JSONB DEFAULT '[]',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'completed'
      )
    `);
    console.log('✓ Tạo bảng evaluation_responses');

    // Tạo indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_templates_slug ON question_templates(slug)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_templates_created ON question_templates(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON evaluation_sessions(token)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON evaluation_sessions(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_responses_session ON evaluation_responses(session_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_responses_template ON evaluation_responses(template_id)`);
    console.log('✓ Tạo indexes');

    // Tạo trigger update_updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_templates_updated_at ON question_templates
    `);
    await pool.query(`
      CREATE TRIGGER update_templates_updated_at 
      BEFORE UPDATE ON question_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✓ Tạo trigger updated_at');

  } finally {
    await pool.end();
  }
}

// Step 3: Import dữ liệu từ JSON
async function importData() {
  const pool = new Pool({ ...dbConfig, database: dbName });
  const dataDir = path.join(__dirname, 'data');
  
  try {
    // Import templates
    const templatesFile = path.join(dataDir, 'templates.json');
    if (fs.existsSync(templatesFile)) {
      const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf-8'));
      
      for (const t of templates) {
        // Check if template already exists
        const existing = await pool.query('SELECT id FROM question_templates WHERE id = $1', [t.id]);
        
        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO question_templates 
            (id, name, slug, description, roles, questions, subjects, subject_questions, template_questions, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            t.id,
            t.name,
            t.slug || t.id,
            t.description || '',
            JSON.stringify(t.roles || []),
            JSON.stringify(t.questions || []),
            JSON.stringify(t.subjects || []),
            JSON.stringify(t.subjectQuestions || t.subject_questions || []),
            JSON.stringify(t.templateQuestions || t.template_questions || []),
            t.isActive || t.is_active || false,
            t.createdAt || t.created_at || new Date().toISOString(),
            t.updatedAt || t.updated_at || new Date().toISOString()
          ]);
          console.log(`  ✓ Import template: ${t.name}`);
        } else {
          console.log(`  - Template đã tồn tại: ${t.name}`);
        }
      }
      console.log(`✓ Import ${templates.length} templates`);
    }

    // Import evaluations
    const evaluationsFile = path.join(dataDir, 'evaluations.json');
    if (fs.existsSync(evaluationsFile)) {
      const evaluations = JSON.parse(fs.readFileSync(evaluationsFile, 'utf-8'));
      
      for (const e of evaluations) {
        const existing = await pool.query('SELECT id FROM evaluation_responses WHERE id = $1', [e.id]);
        
        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO evaluation_responses 
            (id, template_id, session_id, department, selected_subjects, answers, subject_details, submitted_at, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            e.id,
            e.templateId || e.template_id,
            e.sessionId || e.session_id || null,
            e.department || '',
            JSON.stringify(e.selectedSubjects || e.selected_subjects || []),
            JSON.stringify(e.answers || {}),
            JSON.stringify(e.subjectDetails || e.subject_details || []),
            e.submittedAt || e.submitted_at || new Date().toISOString(),
            e.status || 'completed'
          ]);
        }
      }
      console.log(`✓ Import ${evaluations.length} evaluations`);
    }

    // Import sessions
    const sessionsFile = path.join(dataDir, 'sessions.json');
    if (fs.existsSync(sessionsFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
      
      for (const s of sessions) {
        const existing = await pool.query('SELECT id FROM evaluation_sessions WHERE id = $1', [s.id]);
        
        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO evaluation_sessions 
            (id, name, description, evaluator_email, evaluator_name, deadline, subjects, status, created_at, link, token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            s.id,
            s.name,
            s.description || '',
            s.evaluatorEmail || s.evaluator_email || '',
            s.evaluatorName || s.evaluator_name || '',
            s.deadline || new Date().toISOString(),
            JSON.stringify(s.subjects || []),
            s.status || 'pending',
            s.createdAt || s.created_at || new Date().toISOString(),
            s.link || null,
            s.token || null
          ]);
        }
      }
      console.log(`✓ Import ${sessions.length} sessions`);
    }

  } finally {
    await pool.end();
  }
}

// Main
async function migrate() {
  console.log('🚀 Bắt đầu migration...\n');
  
  try {
    console.log('📦 Step 1: Tạo database');
    await createDatabase();
    
    console.log('\n📋 Step 2: Tạo các bảng');
    await createTables();
    
    console.log('\n📥 Step 3: Import dữ liệu từ JSON');
    await importData();
    
    console.log('\n✅ Migration hoàn tất thành công!');
    console.log('👉 Bây giờ bạn có thể chạy server: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Lỗi migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();
