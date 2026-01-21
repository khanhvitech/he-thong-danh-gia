import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions for JSON fallback
const readJSONFile = (file) => {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
};

const writeJSONFile = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    return false;
  }
};

// Check if PostgreSQL is available
let usePostgres = true;

// Get all templates
export async function getAllTemplates(req, res) {
  if (!usePostgres) {
    // Fallback to JSON
    const templates = readJSONFile(TEMPLATES_FILE);
    return res.json(templates);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM question_templates ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates from PostgreSQL, using JSON fallback:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    res.json(templates);
  }
}

// Get template by ID
export async function getTemplateById(req, res) {
  const { id } = req.params;
  
  if (!usePostgres) {
    const templates = readJSONFile(TEMPLATES_FILE);
    const template = templates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    return res.json(template);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM question_templates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template, using JSON fallback:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    const template = templates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    res.json(template);
  }
}

// Create new template
export async function createTemplate(req, res) {
  const { id, name, description, roles, questions, subjects, subjectQuestions, templateQuestions, isActive } = req.body;
  const templateId = id || `template-${Date.now()}`;
  const now = new Date().toISOString();
  
  const newTemplate = {
    id: templateId,
    name,
    description: description || '',
    roles: roles || [],
    questions: questions || [],
    subjects: subjects || [],
    subject_questions: subjectQuestions || [],
    templateQuestions: templateQuestions || [],
    isActive: isActive !== undefined ? isActive : false,
    created_at: now,
    updated_at: now,
  };
  
  if (!usePostgres) {
    const templates = readJSONFile(TEMPLATES_FILE);
    templates.push(newTemplate);
    if (writeJSONFile(TEMPLATES_FILE, templates)) {
      return res.status(201).json(newTemplate);
    } else {
      return res.status(500).json({ error: 'Lỗi khi lưu template' });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO question_templates 
       (id, name, description, roles, questions, subjects, subject_questions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        templateId,
        name,
        description || '',
        JSON.stringify(roles || []),
        JSON.stringify(questions || []),
        JSON.stringify(subjects || []),
        JSON.stringify(subjectQuestions || [])
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating template, using JSON fallback:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    templates.push(newTemplate);
    if (writeJSONFile(TEMPLATES_FILE, templates)) {
      res.status(201).json(newTemplate);
    } else {
      res.status(500).json({ error: 'Lỗi khi lưu template' });
    }
  }
}

// Update template
export async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, description, roles, questions, subjects, subjectQuestions, templateQuestions, isActive } = req.body;
  const now = new Date().toISOString();
  
  if (!usePostgres) {
    const templates = readJSONFile(TEMPLATES_FILE);
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    templates[index] = {
      ...templates[index],
      name,
      description: description || '',
      roles: roles || [],
      questions: questions || [],
      subjects: subjects || [],
      subject_questions: subjectQuestions || [],
      templateQuestions: templateQuestions || [],
      isActive: isActive !== undefined ? isActive : templates[index].isActive,
      updated_at: now,
    };
    
    if (writeJSONFile(TEMPLATES_FILE, templates)) {
      return res.json(templates[index]);
    } else {
      return res.status(500).json({ error: 'Lỗi khi cập nhật template' });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE question_templates 
       SET name = $1, description = $2, roles = $3, questions = $4, 
           subjects = $5, subject_questions = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name,
        description || '',
        JSON.stringify(roles || []),
        JSON.stringify(questions || []),
        JSON.stringify(subjects || []),
        JSON.stringify(subjectQuestions || []),
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating template, using JSON fallback:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    templates[index] = {
      ...templates[index],
      name,
      description: description || '',
      roles: roles || [],
      questions: questions || [],
      subjects: subjects || [],
      subject_questions: subjectQuestions || [],
      templateQuestions: templateQuestions || [],
      updated_at: now,
    };
    
    if (writeJSONFile(TEMPLATES_FILE, templates)) {
      res.json(templates[index]);
    } else {
      res.status(500).json({ error: 'Lỗi khi cập nhật template' });
    }
  }
}

// Delete template
export async function deleteTemplate(req, res) {
  const { id } = req.params;
  
  if (!usePostgres) {
    const templates = readJSONFile(TEMPLATES_FILE);
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    if (writeJSONFile(TEMPLATES_FILE, filtered)) {
      return res.json({ message: 'Đã xóa template thành công' });
    } else {
      return res.status(500).json({ error: 'Lỗi khi xóa template' });
    }
  }

  try {
    const result = await pool.query(
      'DELETE FROM question_templates WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    res.json({ message: 'Đã xóa template thành công' });
  } catch (error) {
    console.error('Error deleting template, using JSON fallback:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    if (writeJSONFile(TEMPLATES_FILE, filtered)) {
      res.json({ message: 'Đã xóa template thành công' });
    } else {
      res.status(500).json({ error: 'Lỗi khi xóa template' });
    }
  }
}
