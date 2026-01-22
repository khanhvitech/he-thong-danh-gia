import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVALUATIONS_FILE = path.join(DATA_DIR, 'evaluations.json');
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

// Get all evaluations
export async function getAllEvaluations(req, res) {
  if (!usePostgres) {
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    return res.json(evaluations);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses ORDER BY submitted_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations, using JSON fallback:', error);
    usePostgres = false;
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    res.json(evaluations);
  }
}

// Get evaluations by template ID
export async function getEvaluationsByTemplate(req, res) {
  const { templateId } = req.params;
  
  if (!usePostgres) {
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    const filtered = evaluations.filter(e => e.templateId === templateId);
    return res.json(filtered);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses WHERE template_id = $1 ORDER BY submitted_at DESC',
      [templateId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations, using JSON fallback:', error);
    usePostgres = false;
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    const filtered = evaluations.filter(e => e.templateId === templateId);
    res.json(filtered);
  }
}

// Get evaluations by session ID (legacy)
export async function getEvaluationsBySession(req, res) {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM evaluation_responses WHERE session_id = $1 ORDER BY submitted_at DESC',
      [sessionId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Lỗi khi lấy evaluations' });
  }
}

// Submit evaluation
export async function submitEvaluation(req, res) {
  const { 
    templateId, 
    department, 
    selectedSubjects, 
    answers,
    subjectDetails
  } = req.body;
  
  const evaluation = {
    id: `eval-${Date.now()}`,
    templateId,
    department,
    selectedSubjects,
    answers,
    subjectDetails,
    submittedAt: new Date().toISOString(),
    status: 'completed'
  };

  if (!usePostgres) {
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    evaluations.push(evaluation);
    writeJSONFile(EVALUATIONS_FILE, evaluations);
    return res.status(201).json(evaluation);
  }

  try {
    const result = await pool.query(
      `INSERT INTO evaluation_responses 
       (id, template_id, department, selected_subjects, answers, subject_details, submitted_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       RETURNING *`,
      [
        evaluation.id,
        templateId,
        department,
        JSON.stringify(selectedSubjects || []),
        JSON.stringify(answers || {}),
        JSON.stringify(subjectDetails || []),
        'completed'
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting evaluation, using JSON fallback:', error);
    usePostgres = false;
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    evaluations.push(evaluation);
    writeJSONFile(EVALUATIONS_FILE, evaluations);
    res.status(201).json(evaluation);
  }
}

// Get template statistics
export async function getTemplateStatistics(req, res) {
  const { templateId } = req.params;
  
  try {
    // Get template from PostgreSQL
    let template;
    if (usePostgres) {
      const templateResult = await pool.query(
        'SELECT * FROM question_templates WHERE id = $1',
        [templateId]
      );
      if (templateResult.rows.length > 0) {
        template = templateResult.rows[0];
      }
    }
    
    // Fallback to JSON if not found
    if (!template) {
      const templates = readJSONFile(TEMPLATES_FILE);
      template = templates.find(t => t.id === templateId);
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy template' });
    }
    
    // Get evaluations from PostgreSQL
    let templateEvaluations = [];
    if (usePostgres) {
      const evalResult = await pool.query(
        'SELECT * FROM evaluation_responses WHERE template_id = $1 ORDER BY submitted_at DESC',
        [templateId]
      );
      templateEvaluations = evalResult.rows.map(row => ({
        id: row.id,
        templateId: row.template_id,
        department: row.department,
        selectedSubjects: row.selected_subjects,
        answers: row.answers,
        subjectDetails: row.subject_details,
        submittedAt: row.submitted_at,
        status: row.status
      }));
    }
    
    // Fallback to JSON if no results
    if (templateEvaluations.length === 0) {
      const evaluations = readJSONFile(EVALUATIONS_FILE);
      templateEvaluations = evaluations.filter(e => e.templateId === templateId);
    }
  
    // Calculate statistics
    const totalResponses = templateEvaluations.length;
    
    // Department statistics
    const departmentStats = {};
    templateEvaluations.forEach(e => {
      const dept = e.department || 'Không xác định';
      if (!departmentStats[dept]) {
        departmentStats[dept] = 0;
      }
      departmentStats[dept]++;
    });
    
    // Subject statistics
    const subjectStats = {};
    const subjects = template.subjects || [];
    
    subjects.forEach(subject => {
      const subjectEvals = templateEvaluations.filter(e => 
        e.selectedSubjects?.includes(subject.id)
      );
      
      // Count ratings if any
      let totalRating = 0;
      let ratingCount = 0;
      
      subjectEvals.forEach(e => {
        const answers = e.answers || {};
        Object.keys(answers).forEach(key => {
          if (key.startsWith(`${subject.id}-`) && typeof answers[key] === 'number') {
            totalRating += answers[key];
            ratingCount++;
          }
        });
      });
      
      subjectStats[subject.id] = {
        name: subject.name,
        totalEvaluations: subjectEvals.length,
        averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : null,
      };
    });
    
    // Get ranking data
    const rankingData = {};
    subjects.forEach(subject => {
      rankingData[subject.id] = {
        name: subject.name,
        ranks: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
      };
    });
    
    templateEvaluations.forEach(e => {
      const answers = e.answers || {};
      Object.keys(answers).forEach(key => {
        if (key.startsWith('common-')) {
          const value = answers[key];
          if (typeof value === 'object') {
            // This is a ranking answer
            Object.keys(value).forEach(rank => {
              const subjectId = value[rank];
              if (rankingData[subjectId] && rankingData[subjectId].ranks[rank] !== undefined) {
                rankingData[subjectId].ranks[rank]++;
              }
            });
          }
        }
      });
    });
    
    res.json({
      templateId,
      templateName: template.name,
      totalResponses,
      departmentStats,
      subjectStats,
      rankingData,
      evaluations: templateEvaluations,
    });
  } catch (error) {
    console.error('Error getting template statistics:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
}

// Delete evaluation
export async function deleteEvaluation(req, res) {
  const { id } = req.params;
  
  if (!usePostgres) {
    const evaluations = readJSONFile(EVALUATIONS_FILE);
    const filtered = evaluations.filter(e => e.id !== id);
    writeJSONFile(EVALUATIONS_FILE, filtered);
    return res.json({ message: 'Đã xóa đánh giá' });
  }

  try {
    await pool.query('DELETE FROM evaluation_responses WHERE id = $1', [id]);
    res.json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Lỗi khi xóa đánh giá' });
  }
}

// Get session statistics (legacy)
export async function getSessionStatistics(req, res) {
  try {
    const { sessionId } = req.params;
    res.json({ message: 'Legacy endpoint - use template statistics instead' });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
}
