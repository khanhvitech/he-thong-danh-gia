import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionsFilePath = path.join(__dirname, '../data/sessions.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize sessions file if not exists
if (!fs.existsSync(sessionsFilePath)) {
  fs.writeFileSync(sessionsFilePath, JSON.stringify([]));
}

// Helper function to read sessions from file
function readSessionsFromFile() {
  try {
    const data = fs.readFileSync(sessionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions file:', error);
    return [];
  }
}

// Helper function to write sessions to file
function writeSessionsToFile(sessions) {
  try {
    fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions file:', error);
  }
}

// Get all sessions
export async function getAllSessions(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions from DB, using file:', error);
    // Fallback to file
    const sessions = readSessionsFromFile();
    res.json(sessions);
  }
}

// Get session by ID
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session from DB, using file:', error);
    // Fallback to file
    const sessions = readSessionsFromFile();
    const session = sessions.find(s => s.id === req.params.id);
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: 'Không tìm thấy session' });
    }
  }
}

// Get session by token (for evaluator access)
export async function getSessionByToken(req, res) {
  try {
    const { token } = req.params;
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions WHERE token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session by token from DB, using file:', error);
    // Fallback to file
    const sessions = readSessionsFromFile();
    const session = sessions.find(s => s.token === req.params.token);
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: 'Không tìm thấy session' });
    }
  }
}

// Create new session
export async function createSession(req, res) {
  const { id, name, description, evaluatorEmail, evaluatorName, deadline, subjects, status } = req.body;
  const token = uuidv4();
  const sessionId = id || `session-${Date.now()}`;
  const createdAt = new Date().toISOString();
  
  const sessionData = {
    id: sessionId,
    name,
    description: description || '',
    evaluator_email: evaluatorEmail || '',
    evaluatorEmail: evaluatorEmail || '',
    evaluator_name: evaluatorName || '',
    evaluatorName: evaluatorName || '',
    deadline,
    subjects: subjects || [],
    status: status || 'pending',
    token,
    created_at: createdAt,
    createdAt
  };
  
  try {
    const result = await pool.query(
      `INSERT INTO evaluation_sessions 
       (id, name, description, evaluator_email, evaluator_name, deadline, subjects, status, token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        sessionId,
        name,
        description || '',
        evaluatorEmail || '',
        evaluatorName || '',
        deadline,
        JSON.stringify(subjects || []),
        status || 'pending',
        token
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (dbError) {
    console.error('PostgreSQL error, using JSON fallback:', dbError.message);
    // Fallback to file
    try {
      const sessions = readSessionsFromFile();
      sessions.push(sessionData);
      writeSessionsToFile(sessions);
      res.status(201).json(sessionData);
    } catch (fileError) {
      console.error('File fallback error:', fileError);
      res.status(500).json({ error: 'Lỗi khi tạo session' });
    }
  }
}

// Update session
export async function updateSession(req, res) {
  try {
    const { id } = req.params;
    const { name, description, evaluatorEmail, evaluatorName, deadline, subjects, status } = req.body;
    
    const result = await pool.query(
      `UPDATE evaluation_sessions 
       SET name = $1, description = $2, evaluator_email = $3, evaluator_name = $4,
           deadline = $5, subjects = $6, status = $7
       WHERE id = $8
       RETURNING *`,
      [
        name,
        description || '',
        evaluatorEmail,
        evaluatorName,
        deadline,
        JSON.stringify(subjects || []),
        status,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật session' });
  }
}

// Delete session
export async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM evaluation_sessions WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' });
    }
    
    res.json({ message: 'Đã xóa session thành công' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Lỗi khi xóa session' });
  }
}
