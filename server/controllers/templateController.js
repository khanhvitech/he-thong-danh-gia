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

// Hàm chuyển đổi tiếng Việt thành slug
function generateSlug(text) {
  // Bảng chuyển đổi tiếng Việt
  const vietnameseMap = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  };
  
  let slug = text.split('').map(char => vietnameseMap[char] || char).join('');
  slug = slug.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Xóa ký tự đặc biệt
    .replace(/\s+/g, '-')          // Thay khoảng trắng bằng -
    .replace(/-+/g, '-')           // Xóa -- thành -
    .replace(/^-|-$/g, '');        // Xóa - ở đầu và cuối
  
  return slug;
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

// Get template by slug (for public evaluation link)
export async function getTemplateBySlug(req, res) {
  const { slug } = req.params;
  
  if (!usePostgres) {
    const templates = readJSONFile(TEMPLATES_FILE);
    const template = templates.find(t => t.slug === slug);
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    return res.json(template);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM question_templates WHERE slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template by slug:', error);
    usePostgres = false;
    const templates = readJSONFile(TEMPLATES_FILE);
    const template = templates.find(t => t.slug === slug);
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
  const slug = generateSlug(name);
  const now = new Date().toISOString();
  
  const newTemplate = {
    id: templateId,
    name,
    slug,
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
       (id, name, slug, description, roles, questions, subjects, subject_questions, template_questions, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        templateId,
        name,
        slug,
        description || '',
        JSON.stringify(roles || []),
        JSON.stringify(questions || []),
        JSON.stringify(subjects || []),
        JSON.stringify(subjectQuestions || []),
        JSON.stringify(templateQuestions || []),
        isActive || false
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
  const slug = generateSlug(name);
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
      slug,
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
       SET name = $1, slug = $2, description = $3, roles = $4, questions = $5, 
           subjects = $6, subject_questions = $7, template_questions = $8, is_active = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        name,
        slug,
        description || '',
        JSON.stringify(roles || []),
        JSON.stringify(questions || []),
        JSON.stringify(subjects || []),
        JSON.stringify(subjectQuestions || []),
        JSON.stringify(templateQuestions || []),
        isActive !== undefined ? isActive : false,
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
      slug,
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
