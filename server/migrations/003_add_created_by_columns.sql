-- Migration: Thêm cột theo dõi người tạo và người chỉnh sửa
-- Created: 2026-02-03

-- Thêm cột created_by: Người tạo bộ câu hỏi
ALTER TABLE question_templates 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT NULL;

-- Thêm cột last_modified_by: Người chỉnh sửa lần cuối
ALTER TABLE question_templates 
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT NULL;

-- Comment để giải thích
COMMENT ON COLUMN question_templates.created_by IS 'Tên người tạo bộ câu hỏi';
COMMENT ON COLUMN question_templates.last_modified_by IS 'Tên người chỉnh sửa lần cuối';
