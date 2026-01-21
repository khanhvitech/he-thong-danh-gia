import pool from '../db.js';

// Get all evaluations
export async function getAllEvaluations(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses ORDER BY submitted_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách evaluations' });
  }
}

// Get evaluations by session ID
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
  try {
    const { id, sessionId, evaluatorName, evaluatorEmail, subjectEvaluations, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO evaluation_responses 
       (id, session_id, evaluator_name, evaluator_email, subject_evaluations, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        id || `evaluation-${Date.now()}`,
        sessionId,
        evaluatorName,
        evaluatorEmail,
        JSON.stringify(subjectEvaluations || []),
        status || 'completed'
      ]
    );
    
    // Update session status to 'completed' if not already
    await pool.query(
      "UPDATE evaluation_sessions SET status = 'completed' WHERE id = $1 AND status = 'pending'",
      [sessionId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ error: 'Lỗi khi gửi đánh giá' });
  }
}

// Get evaluation statistics for a session
export async function getSessionStatistics(req, res) {
  try {
    const { sessionId } = req.params;
    
    // Get session
    const sessionResult = await pool.query(
      'SELECT * FROM evaluation_sessions WHERE id = $1',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' });
    }
    
    const session = sessionResult.rows[0];
    
    // Get evaluations for this session
    const evaluationsResult = await pool.query(
      'SELECT * FROM evaluation_responses WHERE session_id = $1',
      [sessionId]
    );
    
    const sessionEvaluations = evaluationsResult.rows;
    
    // Calculate statistics
    const totalEvaluations = sessionEvaluations.length;
    const completedEvaluations = sessionEvaluations.filter(e => e.status === 'completed').length;
    
    // Subject statistics
    const subjectStats = {};
    const subjects = session.subjects || [];
    
    subjects.forEach(subject => {
      const subjectEvals = sessionEvaluations.flatMap(e => {
        const subjectEvaluations = e.subject_evaluations || [];
        return subjectEvaluations.filter(se => se.subjectId === subject.id);
      });
      
      const ratings = subjectEvals.flatMap(se => {
        const answers = se.answers || [];
        return answers.filter(a => typeof a.value === 'number').map(a => a.value);
      });
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;
      
      subjectStats[subject.id] = {
        subjectName: subject.name,
        totalResponses: subjectEvals.length,
        averageRating: avgRating.toFixed(2),
        completedEvaluations: subjectEvals.filter(se => se.completedAt).length,
      };
    });
    
    res.json({
      sessionId,
      sessionName: session.name,
      totalEvaluations,
      completedEvaluations,
      completionRate: totalEvaluations > 0 
        ? ((completedEvaluations / totalEvaluations) * 100).toFixed(1) 
        : 0,
      subjectStatistics: subjectStats,
      evaluations: sessionEvaluations,
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
}
