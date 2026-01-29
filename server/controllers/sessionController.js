import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to format session response (snake_case to camelCase)
function formatSessionResponse(session) {
  if (!session) return null;
  return {
    id: session.id,
    name: session.name,
    description: session.description,
    evaluatorEmail: session.evaluator_email || session.evaluatorEmail,
    evaluatorName: session.evaluator_name || session.evaluatorName,
    deadline: session.deadline,
    subjects: session.subjects,
    status: session.status,
    token: session.token,
    createdAt: session.created_at || session.createdAt,
    // Also include snake_case for compatibility
    evaluator_email: session.evaluator_email || session.evaluatorEmail,
    evaluator_name: session.evaluator_name || session.evaluatorName,
    created_at: session.created_at || session.createdAt
  };
}

// Get all sessions
export async function getAllSessions(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions ORDER BY created_at DESC'
    );
    res.json(result.rows.map(formatSessionResponse));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách phiên đánh giá' });
  }
}

// Get session by ID
export async function getSessionById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phiên đánh giá' });
    }
    
    res.json(formatSessionResponse(result.rows[0]));
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Lỗi khi tải phiên đánh giá' });
  }
}

// Get session by token (for evaluator access)
export async function getSessionByToken(req, res) {
  const { token } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_sessions WHERE token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phiên đánh giá' });
    }
    
    res.json(formatSessionResponse(result.rows[0]));
  } catch (error) {
    console.error('Error fetching session by token:', error);
    res.status(500).json({ error: 'Lỗi khi tải phiên đánh giá' });
  }
}

// Create new session
export async function createSession(req, res) {
  const { id, name, description, evaluatorEmail, evaluatorName, deadline, subjects, status } = req.body;
  const token = uuidv4();
  const sessionId = id || `session-${Date.now()}`;
  
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
    res.status(201).json(formatSessionResponse(result.rows[0]));
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Lỗi khi tạo phiên đánh giá' });
  }
}

// Update session
export async function updateSession(req, res) {
  const { id } = req.params;
  const { name, description, evaluatorEmail, evaluatorName, deadline, subjects, status } = req.body;

  try {
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
      return res.status(404).json({ error: 'Không tìm thấy phiên đánh giá' });
    }
    
    res.json(formatSessionResponse(result.rows[0]));
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật phiên đánh giá' });
  }
}

// Delete session
export async function deleteSession(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM evaluation_sessions WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phiên đánh giá' });
    }
    
    res.json({ message: 'Đã xóa phiên đánh giá thành công' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Lỗi khi xóa phiên đánh giá' });
  }
}
