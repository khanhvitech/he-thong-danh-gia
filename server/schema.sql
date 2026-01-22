-- Bảng question_templates: Lưu thông tin bộ câu hỏi
CREATE TABLE IF NOT EXISTS question_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE,
    description TEXT,
    roles JSONB DEFAULT '[]',
    questions JSONB DEFAULT '[]',
    subjects JSONB DEFAULT '[]',
    subject_questions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho slug
CREATE INDEX IF NOT EXISTS idx_templates_slug ON question_templates(slug);

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
    template_id VARCHAR(255),
    session_id VARCHAR(255) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
    department VARCHAR(255),
    selected_subjects JSONB DEFAULT '[]',
    answers JSONB DEFAULT '{}',
    subject_details JSONB DEFAULT '[]',
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
CREATE INDEX IF NOT EXISTS idx_responses_template ON evaluation_responses(template_id);
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
