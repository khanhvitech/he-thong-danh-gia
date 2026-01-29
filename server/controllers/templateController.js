import pool from '../db.js';

// Hàm chuyển đổi tiếng Việt thành slug
function generateSlug(text) {
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return slug;
}

// Check slug duplicate
async function checkSlugDuplicate(slug, excludeId = null) {
  let query = 'SELECT id FROM question_templates WHERE slug = $1';
  let params = [slug];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// Helper: Convert PostgreSQL row to frontend format
function formatTemplateResponse(row) {
  if (!row) return null;
  return {
    ...row,
    templateQuestions: row.template_questions || row.templateQuestions || [],
    subjectQuestions: row.subject_questions || row.subjectQuestions || [],
    isActive: row.is_active !== undefined ? row.is_active : row.isActive,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    type: row.type || 'other',
    selectionQuestion: row.selection_question || row.selectionQuestion || null,
    minSelections: row.min_selections || row.minSelections || 1,
  };
}

// Get all templates
export async function getAllTemplates(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM question_templates ORDER BY created_at DESC'
    );
    res.json(result.rows.map(formatTemplateResponse));
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách bộ câu hỏi' });
  }
}

// Get template by ID
export async function getTemplateById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM question_templates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json(formatTemplateResponse(result.rows[0]));
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Lỗi khi tải bộ câu hỏi' });
  }
}

// Get template by slug (for public evaluation link)
// Also supports finding by ID as fallback
export async function getTemplateBySlug(req, res) {
  const { slug } = req.params;

  try {
    // First try to find by slug
    let result = await pool.query(
      'SELECT * FROM question_templates WHERE slug = $1',
      [slug]
    );
    
    // If not found by slug, try to find by ID
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT * FROM question_templates WHERE id = $1',
        [slug]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json(formatTemplateResponse(result.rows[0]));
  } catch (error) {
    console.error('Error fetching template by slug:', error);
    res.status(500).json({ error: 'Lỗi khi tải bộ câu hỏi' });
  }
}

// Create new template
export async function createTemplate(req, res) {
  const { id, name, description, roles, questions, subjects, subjectQuestions, templateQuestions, isActive, type, selectionQuestion, minSelections } = req.body;
  const templateId = id || `template-${Date.now()}`;
  const slug = generateSlug(name);
  
  try {
    // Check for duplicate slug
    const isDuplicate = await checkSlugDuplicate(slug);
    if (isDuplicate) {
      return res.status(400).json({ error: 'Tên bộ câu hỏi đã tồn tại. Vui lòng chọn tên khác.' });
    }

    const result = await pool.query(
      `INSERT INTO question_templates 
       (id, name, slug, description, roles, questions, subjects, subject_questions, template_questions, is_active, type, selection_question, min_selections, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
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
        isActive || false,
        type || 'other',
        selectionQuestion || null,
        minSelections || 1
      ]
    );
    
    res.status(201).json(formatTemplateResponse(result.rows[0]));
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Lỗi khi tạo bộ câu hỏi' });
  }
}

// Update template
export async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, description, roles, questions, subjects, subjectQuestions, templateQuestions, isActive, type, selectionQuestion, minSelections } = req.body;
  const slug = generateSlug(name);
  
  try {
    // Check for duplicate slug (excluding current template)
    const isDuplicate = await checkSlugDuplicate(slug, id);
    if (isDuplicate) {
      return res.status(400).json({ error: 'Tên bộ câu hỏi đã tồn tại. Vui lòng chọn tên khác.' });
    }

    const result = await pool.query(
      `UPDATE question_templates 
       SET name = $1, slug = $2, description = $3, roles = $4, questions = $5, 
           subjects = $6, subject_questions = $7, template_questions = $8, is_active = $9, type = $10, 
           selection_question = $11, min_selections = $12, updated_at = NOW()
       WHERE id = $13
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
        type || 'other',
        selectionQuestion || null,
        minSelections || 1,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json(formatTemplateResponse(result.rows[0]));
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật bộ câu hỏi' });
  }
}

// Delete template
export async function deleteTemplate(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM question_templates WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json({ message: 'Đã xóa bộ câu hỏi thành công' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Lỗi khi xóa bộ câu hỏi' });
  }
}

// Increment view count when someone visits the evaluation link
export async function incrementViewCount(req, res) {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      `UPDATE question_templates 
       SET view_count = COALESCE(view_count, 0) + 1
       WHERE slug = $1
       RETURNING id, view_count`,
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json({ viewCount: result.rows[0].view_count });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật lượt xem' });
  }
}

// Get all templates with evaluation count statistics
export async function getTemplatesWithStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        qt.*,
        COALESCE(er.evaluation_count, 0) as evaluation_count
      FROM question_templates qt
      LEFT JOIN (
        SELECT template_id, COUNT(*) as evaluation_count
        FROM evaluation_responses
        GROUP BY template_id
      ) er ON qt.id = er.template_id
      ORDER BY qt.created_at DESC
    `);
    
    res.json(result.rows.map(row => ({
      ...formatTemplateResponse(row),
      viewCount: row.view_count || 0,
      evaluationCount: parseInt(row.evaluation_count) || 0,
    })));
  } catch (error) {
    console.error('Error fetching templates with stats:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách bộ câu hỏi' });
  }
}

// Reset view count for a template
export async function resetViewCount(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE question_templates 
       SET view_count = 0
       WHERE id = $1
       RETURNING id, view_count`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi' });
    }
    
    res.json({ message: 'Đã reset lượt xem', viewCount: 0 });
  } catch (error) {
    console.error('Error resetting view count:', error);
    res.status(500).json({ error: 'Lỗi khi reset lượt xem' });
  }
}
