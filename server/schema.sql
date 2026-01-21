-- Bảng question_templates: Lưu thông tin bộ câu hỏi
CREATE TABLE IF NOT EXISTS question_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    roles JSONB DEFAULT '[]',
    questions JSONB DEFAULT '[]',
    subjects JSONB DEFAULT '[]',
    subject_questions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng evaluation_sessions: Lưu phiên đánh giá
CREATE TABLE IF NOT EXISTS evaluation_sessions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    evaluator_email VARCHAR(255) NOT NULL,
    evaluator_name VARCHAR(255) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    subjects JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    link TEXT,
    token VARCHAR(255) UNIQUE
);

-- Bảng evaluation_responses: Lưu kết quả đánh giá
CREATE TABLE IF NOT EXISTS evaluation_responses (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
    evaluator_name VARCHAR(255),
    evaluator_email VARCHAR(255),
    subject_evaluations JSONB DEFAULT '[]',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed'
);

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_sessions_token ON evaluation_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON evaluation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_responses_session ON evaluation_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_templates_created ON question_templates(created_at DESC);

-- Trigger để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON question_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Chèn dữ liệu mẫu (tùy chọn)
INSERT INTO question_templates (id, name, description, roles, questions, subjects, subject_questions, created_at, updated_at)
VALUES 
    ('template-1', 'Đánh giá lãnh đạo Q1/2024', 'Bộ câu hỏi đánh giá hiệu quả lãnh đạo quý 1', '[]', 
    '[{"id":"q1","type":"rating-5","content":"Đánh giá chung về khả năng lãnh đạo","required":true}]',
    '[{"id":"1","name":"Lê Đức Nam"},{"id":"2","name":"Hoàng Thị Nga"}]',
    '[{"subjectId":"1","questions":[{"id":"sq1","type":"rating-5","content":"Khả năng giao tiếp","required":true}]}]',
    NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
