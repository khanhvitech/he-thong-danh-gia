import pool from '../db.js';

// Helper: Convert PostgreSQL row to frontend format
function formatEvaluationResponse(row) {
  if (!row) return null;
  return {
    ...row,
    templateId: row.template_id || row.templateId,
    sessionId: row.session_id || row.sessionId,
    selectedSubjects: row.selected_subjects || row.selectedSubjects || [],
    subjectDetails: row.subject_details || row.subjectDetails || [],
    submittedAt: row.submitted_at || row.submittedAt,
  };
}

// Get all evaluations
export async function getAllEvaluations(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses ORDER BY submitted_at DESC'
    );
    res.json(result.rows.map(formatEvaluationResponse));
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách đánh giá' });
  }
}

// Get evaluations by template ID
export async function getEvaluationsByTemplate(req, res) {
  const { templateId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses WHERE template_id = $1 ORDER BY submitted_at DESC',
      [templateId]
    );
    res.json(result.rows.map(formatEvaluationResponse));
  } catch (error) {
    console.error('Error fetching evaluations by template:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách đánh giá' });
  }
}

// Get evaluations by session ID (legacy)
export async function getEvaluationsBySession(req, res) {
  const { sessionId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluation_responses WHERE session_id = $1 ORDER BY submitted_at DESC',
      [sessionId]
    );
    res.json(result.rows.map(formatEvaluationResponse));
  } catch (error) {
    console.error('Error fetching evaluations by session:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách đánh giá' });
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
  
  const evaluationId = `eval-${Date.now()}`;

  try {
    const result = await pool.query(
      `INSERT INTO evaluation_responses 
       (id, template_id, department, selected_subjects, answers, subject_details, submitted_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       RETURNING *`,
      [
        evaluationId,
        templateId,
        department,
        JSON.stringify(selectedSubjects || []),
        JSON.stringify(answers || {}),
        JSON.stringify(subjectDetails || []),
        'completed'
      ]
    );
    
    res.status(201).json(formatEvaluationResponse(result.rows[0]));
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ error: 'Lỗi khi gửi đánh giá' });
  }
}

// Helper function to format template response
function formatTemplate(template) {
  if (!template) return null;
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    description: template.description,
    roles: template.roles,
    questions: template.questions,
    subjects: template.subjects,
    subjectQuestions: template.subject_questions || template.subjectQuestions,
    templateQuestions: template.template_questions || template.templateQuestions,
    isActive: template.is_active !== undefined ? template.is_active : template.isActive,
    createdAt: template.created_at || template.createdAt,
    updatedAt: template.updated_at || template.updatedAt
  };
}

// Get template statistics
export async function getTemplateStatistics(req, res) {
  const { templateId } = req.params;
  
  try {
    // Get template from PostgreSQL
    const templateResult = await pool.query(
      'SELECT * FROM question_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    const template = formatTemplate(templateResult.rows[0]);
    
    // Get evaluations from PostgreSQL
    const evalResult = await pool.query(
      'SELECT * FROM evaluation_responses WHERE template_id = $1 ORDER BY submitted_at DESC',
      [templateId]
    );
    const templateEvaluations = evalResult.rows.map(row => formatEvaluationResponse(row));
  
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
          // Hỗ trợ cả 2 format key:
          // - Cũ: {subjectId}-... (ví dụ: subject1-tpl-subject1-q1)
          // - Mới: tpl-{subjectId}-... (ví dụ: tpl-subject1-q1)
          const isOldFormat = key.startsWith(`${subject.id}-`);
          const isNewFormat = key.startsWith(`tpl-${subject.id}-`);
          if ((isOldFormat || isNewFormat) && typeof answers[key] === 'number') {
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

  try {
    await pool.query('DELETE FROM evaluation_responses WHERE id = $1', [id]);
    res.json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Lỗi khi xóa đánh giá' });
  }
}

// Delete all evaluations by template
export async function deleteAllEvaluationsByTemplate(req, res) {
  const { templateId } = req.params;

  try {
    const result = await pool.query('DELETE FROM evaluation_responses WHERE template_id = $1', [templateId]);
    res.json({ message: `Đã xóa ${result.rowCount} đánh giá`, deletedCount: result.rowCount });
  } catch (error) {
    console.error('Error deleting all evaluations:', error);
    res.status(500).json({ error: 'Lỗi khi xóa tất cả đánh giá' });
  }
}

// Get session statistics (legacy)
export async function getSessionStatistics(req, res) {
  res.json({ message: 'Legacy endpoint - use template statistics instead' });
}
