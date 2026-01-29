-- Migration: Thêm cột template_questions vào bảng question_templates
-- Date: 2026-01-29

-- Thêm cột template_questions nếu chưa tồn tại
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_templates' 
        AND column_name = 'template_questions'
    ) THEN
        ALTER TABLE question_templates 
        ADD COLUMN template_questions JSONB DEFAULT '[]';
        
        RAISE NOTICE 'Đã thêm cột template_questions vào bảng question_templates';
    ELSE
        RAISE NOTICE 'Cột template_questions đã tồn tại';
    END IF;
END $$;
