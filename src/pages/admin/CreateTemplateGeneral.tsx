import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Target } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { templatesAPI } from '../../services/api';
import { Question } from '../../types';

interface QuestionForm extends Question {
  tempId: string;
}

const CreateTemplateGeneral: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  // Template info
  const [templateName, setTemplateName] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Câu hỏi chung (đây là các câu hỏi chính cho loại đánh giá này)
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load template data when editing
  useEffect(() => {
    if (isEditMode && id) {
      loadTemplate();
    }
  }, [id, isEditMode]);

  const loadTemplate = async () => {
    try {
      const response = await templatesAPI.getById(id!);
      const template = response.data;
      
      setTemplateName(template.name || '');
      setTemplateSlug(template.slug || '');
      setTemplateDescription(template.description || '');
      
      // Load questions
      const loadedQuestions = (template.questions || []).map((q: Question) => ({
        ...q,
        tempId: generateTempId(),
      }));
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Không thể tải dữ liệu template');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setTemplateName(name);
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setTemplateSlug(slug);
  };

  // Question management
  const addQuestion = () => {
    const newQuestion: QuestionForm = {
      tempId: generateTempId(),
      id: generateTempId(),
      content: '',
      type: 'rating-5',
      description: '',
      required: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (tempId: string, field: keyof QuestionForm, value: any) => {
    setQuestions(questions.map(q =>
      q.tempId === tempId ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (tempId: string) => {
    setQuestions(questions.filter(q => q.tempId !== tempId));
  };

  const handleSave = async () => {
    // Validation
    if (!templateName.trim()) {
      alert('Vui lòng nhập tên bộ câu hỏi');
      return;
    }

    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    // Check if all questions have content
    const emptyQuestions = questions.filter(q => !q.content.trim());
    if (emptyQuestions.length > 0) {
      alert('Vui lòng nhập nội dung cho tất cả câu hỏi');
      return;
    }

    setSaving(true);

    try {
      // Prepare template data - loại đánh giá chung không có subjects
      const templateData = {
        name: templateName,
        slug: templateSlug,
        description: templateDescription,
        type: 'chung', // Loại đánh giá chung
        roles: [],
        subjects: [], // Không có đối tượng đánh giá
        templateQuestions: [], // Không có câu hỏi theo đối tượng
        subjectQuestions: [], // Không có câu hỏi riêng cho từng đối tượng
        questions: questions.map((q, idx) => ({
          id: `q-${idx + 1}`,
          content: q.content,
          type: q.type,
          description: q.description || '',
          required: q.required ?? true,
        })),
        isActive: false,
      };

      if (isEditMode && id) {
        await templatesAPI.update(id, templateData);
        alert('Đã cập nhật bộ câu hỏi thành công!');
      } else {
        await templatesAPI.create(templateData);
        alert('Đã tạo bộ câu hỏi thành công!');
      }
      navigate('/admin/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi lưu bộ câu hỏi';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(isEditMode ? '/admin/templates' : '/admin/templates/new')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Chỉnh Sửa' : 'Tạo'} Bộ Câu Hỏi - Đánh Giá Chung
              </h1>
              <p className="text-sm text-gray-500">
                Khảo sát ẩn danh về văn hóa, hoạt động nội bộ, khảo sát toàn công ty
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} icon={<Save className="w-4 h-4" />}>
          {saving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Lưu bộ câu hỏi')}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Template Info */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Thông tin bộ câu hỏi</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên bộ câu hỏi <span className="text-red-500">*</span>
              </label>
              <Input
                value={templateName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Khảo sát văn hóa công ty 2026"
              />
              <p className="text-xs text-gray-500 mt-1">
                Đường dẫn tự động: <span className="font-mono text-purple-600">{templateSlug || '...'}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả / Hướng dẫn
              </label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Mô tả về bộ câu hỏi này, hướng dẫn cho người tham gia khảo sát..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ HTML: &lt;strong&gt;in đậm&lt;/strong&gt;, &lt;em&gt;in nghiêng&lt;/em&gt;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-900">Về đánh giá chung</h3>
              <p className="text-sm text-purple-700 mt-1">
                Đây là loại khảo sát ẩn danh không yêu cầu chọn đối tượng đánh giá. 
                Phù hợp cho: khảo sát văn hóa công ty, đánh giá hoạt động nội bộ, 
                thu thập ý kiến nhân viên về các vấn đề chung.
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Câu hỏi khảo sát ({questions.length})
              </h2>
              <Button onClick={addQuestion} size="sm" icon={<Plus className="w-4 h-4" />}>
                Thêm câu hỏi
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Chưa có câu hỏi nào</p>
                <p className="text-sm">Nhấn "Thêm câu hỏi" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.tempId}
                    className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center text-gray-400">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                          #{index + 1}
                        </span>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(question.tempId, 'type', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="rating-5">⭐ Đánh giá sao (1-5)</option>
                          <option value="rating-10">📊 Thang điểm (1-10)</option>
                          <option value="text">📝 Văn bản tự do</option>
                          <option value="yes-no">✅ Có / Không</option>
                          <option value="single-choice">🔘 Chọn một</option>
                          <option value="multiple-choice">☑️ Chọn nhiều</option>
                        </select>
                      </div>
                      <Input
                        value={question.content}
                        onChange={(e) => updateQuestion(question.tempId, 'content', e.target.value)}
                        placeholder="Nội dung câu hỏi..."
                        className="font-medium"
                      />
                      <Input
                        value={question.description || ''}
                        onChange={(e) => updateQuestion(question.tempId, 'description', e.target.value)}
                        placeholder="Mô tả thêm (tùy chọn)..."
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(question.tempId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTemplateGeneral;
