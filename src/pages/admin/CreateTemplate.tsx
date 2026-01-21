import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Question, QuestionTemplate, SubjectInTemplate } from '../../types';
import { templatesAPI } from '../../services/api';

const CreateTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { id: templateId } = useParams();
  const isEditMode = !!templateId;
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Common questions for everyone
  const [commonQuestions, setCommonQuestions] = useState<Question[]>([]);

  // List of subjects (people) with checkbox selection
  const [allSubjects] = useState<SubjectInTemplate[]>([
    { id: '2', name: 'Hoàng Thị Nga', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '3', name: 'Nguyễn Đăng Khánh', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '4', name: 'Phạm Ngọc Tuân', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '5', name: 'Đặng Minh Tiến', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '6', name: 'Đặng Mạnh Dũng', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '7', name: 'Lê Tiến Đạt', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
    { id: '8', name: 'Tống Thị Quyên', position: 'Lãnh đạo', department: 'Ban Giám Đốc' },
  ]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Template questions with {name} variable - applies to all selected subjects
  const [templateQuestions, setTemplateQuestions] = useState<Question[]>([]);

  // Individual questions for each selected subject
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, Question[]>>({});

  // Load template data if in edit mode
  useEffect(() => {
    if (isEditMode && templateId) {
      loadTemplateData();
    }
  }, [isEditMode, templateId]);

  const loadTemplateData = async () => {
    setLoading(true);
    try {
      const response = await templatesAPI.getById(templateId!);
      const template = response.data;
      
      // Fill in basic info
      setName(template.name || '');
      setDescription(template.description || '');
      
      // Fill in common questions
      setCommonQuestions(template.questions || []);
      
      // Fill in template questions (with {name} variable)
      const tplQuestions = (template as any).templateQuestions || [];
      setTemplateQuestions(tplQuestions);
      
      // Fill in selected subjects
      const subjectIds = (template.subjects || []).map((s: SubjectInTemplate) => s.id);
      setSelectedSubjects(subjectIds);
      
      // Fill in individual subject questions
      const subjectQuestionsArray = (template as any).subjectQuestions || (template as any).subject_questions || [];
      const subjectQuestionsMap: Record<string, Question[]> = {};
      subjectQuestionsArray.forEach((sq: any) => {
        subjectQuestionsMap[sq.subjectId] = sq.questions || [];
      });
      setSubjectQuestions(subjectQuestionsMap);
      
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Lỗi khi tải bộ câu hỏi');
      navigate('/admin/templates');
    } finally {
      setLoading(false);
    }
  };

  // Add common question
  const addCommonQuestion = () => {
    const newQuestion: Question = {
      id: `cq-${Date.now()}`,
      content: '',
      type: 'rating-5',
      required: true,
    };
    setCommonQuestions([...commonQuestions, newQuestion]);
  };

  // Update common question
  const updateCommonQuestion = (id: string, field: keyof Question, value: any) => {
    setCommonQuestions(
      commonQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Remove common question
  const removeCommonQuestion = (id: string) => {
    setCommonQuestions(commonQuestions.filter((q) => q.id !== id));
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      // Remove subject
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
      // Remove its questions
      const newSubjectQuestions = { ...subjectQuestions };
      delete newSubjectQuestions[subjectId];
      setSubjectQuestions(newSubjectQuestions);
    } else {
      // Add subject
      setSelectedSubjects([...selectedSubjects, subjectId]);
      // Initialize empty questions array
      setSubjectQuestions({
        ...subjectQuestions,
        [subjectId]: [],
      });
    }
  };

  // Add template question (with {name} variable)
  const addTemplateQuestion = () => {
    const newQuestion: Question = {
      id: `tq-${Date.now()}`,
      content: '',
      type: 'rating-5',
      required: true,
    };
    setTemplateQuestions([...templateQuestions, newQuestion]);
  };

  // Update template question
  const updateTemplateQuestion = (id: string, field: keyof Question, value: any) => {
    setTemplateQuestions(
      templateQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Remove template question
  const removeTemplateQuestion = (id: string) => {
    setTemplateQuestions(templateQuestions.filter((q) => q.id !== id));
  };

  // Add question for specific subject
  const addQuestionForSubject = (subjectId: string) => {
    const questions = subjectQuestions[subjectId] || [];
    const newQuestion: Question = {
      id: `sq-${subjectId}-${Date.now()}`,
      content: '',
      type: 'rating-5',
      required: true,
    };
    setSubjectQuestions({
      ...subjectQuestions,
      [subjectId]: [...questions, newQuestion],
    });
  };

  // Update question for specific subject
  const updateQuestionForSubject = (
    subjectId: string,
    questionId: string,
    field: keyof Question,
    value: any
  ) => {
    const questions = subjectQuestions[subjectId] || [];
    setSubjectQuestions({
      ...subjectQuestions,
      [subjectId]: questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    });
  };

  // Remove question for specific subject
  const removeQuestionForSubject = (subjectId: string, questionId: string) => {
    const questions = subjectQuestions[subjectId] || [];
    setSubjectQuestions({
      ...subjectQuestions,
      [subjectId]: questions.filter((q) => q.id !== questionId),
    });
  };

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên bộ câu hỏi');
      return;
    }

    if (commonQuestions.length === 0 && templateQuestions.length === 0 && selectedSubjects.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi chung hoặc chọn ít nhất một người');
      return;
    }

    const template: Omit<QuestionTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      roles: [],
      questions: commonQuestions,
      subjects: selectedSubjects.map((id) => {
        const subject = allSubjects.find((s) => s.id === id)!;
        return {
          id: subject.id,
          name: subject.name,
          position: subject.position,
          department: subject.department,
        };
      }),
      subjectQuestions: selectedSubjects.map((subjectId) => ({
        subjectId,
        questions: subjectQuestions[subjectId] || [],
      })),
      templateQuestions: templateQuestions, // Questions with {name} variable
    };

    try {
      if (isEditMode && templateId) {
        // Update existing template
        const response = await templatesAPI.update(templateId, template);
        console.log('Template updated:', response.data);
        alert('Đã cập nhật bộ câu hỏi thành công!');
      } else {
        // Create new template
        const response = await templatesAPI.create(template);
        console.log('Template saved:', response.data);
        alert('Đã lưu bộ câu hỏi thành công!');
      }
      navigate('/admin/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Lỗi khi lưu bộ câu hỏi. Vui lòng thử lại.');
    }
  };

  // Current active tab for individual questions
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('');

  // Set first selected subject as active when selection changes
  React.useEffect(() => {
    if (selectedSubjects.length > 0 && !selectedSubjects.includes(activeSubjectTab)) {
      setActiveSubjectTab(selectedSubjects[0]);
    }
  }, [selectedSubjects, activeSubjectTab]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Sửa bộ câu hỏi' : 'Tạo bộ câu hỏi mới'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? 'Chỉnh sửa bộ câu hỏi hiện có' 
              : 'Tạo bộ câu hỏi với câu hỏi chung và câu hỏi riêng cho từng người'}
          </p>
        </div>
        <Button onClick={handleSave} icon={<Save />}>
          {isEditMode ? 'Cập nhật' : 'Lưu bộ câu hỏi'}
        </Button>
      </div>

      {/* General Information */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
          <div className="space-y-4">
                <Input
                  label="Tên bộ câu hỏi"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Vd: Đánh giá hiệu quả công việc Q1/2024"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Mô tả ngắn gọn về bộ câu hỏi này - Có thể paste từ Word/Google Docs"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                      ]
                    }}
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Questions Section */}
          <Card className="mb-6 bg-blue-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-blue-900">📝 Câu hỏi chung</h2>
                  <p className="text-sm text-blue-700 mt-1">
                    Các câu hỏi này sẽ áp dụng cho tất cả mọi người
                  </p>
                </div>
                <Button
                  onClick={addCommonQuestion}
                  variant="primary"
                  size="sm"
                  icon={<Plus />}
                >
                  Thêm câu hỏi chung
                </Button>
              </div>

              {commonQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-blue-300">
                  Chưa có câu hỏi chung nào. Nhấn "Thêm câu hỏi chung" để bắt đầu.
                </div>
              )}

              <div className="space-y-4">
                {commonQuestions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg border border-blue-300 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-blue-900">
                        Câu hỏi chung #{index + 1}
                      </span>
                      <Button
                        onClick={() => removeCommonQuestion(question.id)}
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 />}
                        className="text-red-600 hover:text-red-700"
                      >
                        {''}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Input
                        label="Nội dung câu hỏi"
                        value={question.content}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCommonQuestion(question.id, 'content', e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                        required
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          label="Loại câu hỏi"
                          value={question.type}
                          onChange={(e) => updateCommonQuestion(question.id, 'type', e.target.value as any)}
                          options={[
                            { value: 'rating-5', label: 'Đánh giá (1-5 sao)' },
                            { value: 'rating-10', label: 'Đánh giá (1-10 điểm)' },
                            { value: 'text', label: 'Văn bản' },
                            { value: 'yes-no', label: 'Có/Không' },
                            { value: 'ranking', label: 'Sắp xếp thứ hạng' },
                          ]}
                        />

                        <Input
                          label="Mô tả (tùy chọn)"
                          value={question.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateCommonQuestion(question.id, 'description', e.target.value)
                          }
                          placeholder="Hướng dẫn trả lời..."
                        />
                      </div>

                      {question.type === 'text' && (
                        <Input
                          type="number"
                          label="Số ký tự tối đa"
                          value={question.minChars || 500}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateCommonQuestion(question.id, 'minChars', parseInt(e.target.value))
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects Selection Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">👥 Chọn người cần đánh giá</h2>
              <p className="text-base text-gray-700 mb-1">
                <strong>1. Anh/Chị đã có đủ trải nghiệm làm việc hoặc tương tác để chia sẻ góc nhìn với những lãnh đạo nào dưới đây?</strong>
              </p>
              <p className="text-sm text-primary-600 font-medium mb-4">
                👉 Vui lòng chọn ít nhất 02 người
              </p>

              {selectedSubjects.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900 font-medium">
                    ✓ Đã chọn {selectedSubjects.length} người
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSubjects.includes(subject.id)
                        ? 'bg-purple-50 border-purple-400'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="mt-1 mr-3 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{subject.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Questions Section - Questions with {name} variable */}
          {selectedSubjects.length > 0 && (
            <Card className="mb-6 bg-green-50 border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-green-900">📋 Câu hỏi mẫu cho tất cả</h2>
                    <p className="text-sm text-green-700 mt-1">
                      Câu hỏi này sẽ áp dụng cho tất cả người được chọn. Sử dụng <code className="bg-green-200 px-1 rounded">{'{name}'}</code> để thay tên người đó.
                    </p>
                  </div>
                  <Button
                    onClick={addTemplateQuestion}
                    variant="primary"
                    size="sm"
                    icon={<Plus />}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Thêm câu hỏi mẫu
                  </Button>
                </div>

                {templateQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-green-300">
                    Chưa có câu hỏi mẫu nào. Nhấn "Thêm câu hỏi mẫu" để bắt đầu.
                  </div>
                )}

                <div className="space-y-4">
                  {templateQuestions.map((question, index) => (
                    <div key={question.id} className="bg-white rounded-lg border border-green-300 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-green-900">
                          Câu hỏi mẫu #{index + 1}
                        </span>
                        <Button
                          onClick={() => removeTemplateQuestion(question.id)}
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 />}
                          className="text-red-600 hover:text-red-700"
                        >
                          {''}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Input
                            label="Nội dung câu hỏi"
                            value={question.content}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTemplateQuestion(question.id, 'content', e.target.value)}
                            placeholder="Vd: {name} có điểm mạnh gì cần phát huy?"
                            required
                          />
                          <p className="text-xs text-green-600 mt-1">
                            💡 Gợi ý: "{'{name}'} có điểm mạnh gì?", "Góp ý cho {'{name}'}"
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            label="Loại câu hỏi"
                            value={question.type}
                            onChange={(e) => updateTemplateQuestion(question.id, 'type', e.target.value as any)}
                            options={[
                              { value: 'rating-5', label: 'Đánh giá (1-5 sao)' },
                              { value: 'rating-10', label: 'Đánh giá (1-10 điểm)' },
                              { value: 'text', label: 'Văn bản' },
                              { value: 'yes-no', label: 'Có/Không' },
                              { value: 'ranking', label: 'Sắp xếp thứ hạng' },
                            ]}
                          />

                          <Input
                            label="Mô tả (tùy chọn)"
                            value={question.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateTemplateQuestion(question.id, 'description', e.target.value)
                            }
                            placeholder="Hướng dẫn trả lời..."
                          />
                        </div>

                        {question.type === 'text' && (
                          <Input
                            type="number"
                            label="Số ký tự tối đa"
                            value={question.minChars || 500}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateTemplateQuestion(question.id, 'minChars', parseInt(e.target.value))
                            }
                          />
                        )}

                        {/* Preview */}
                        {question.content && selectedSubjects.length > 0 && (
                          <div className="bg-green-100 p-3 rounded-lg">
                            <p className="text-xs font-medium text-green-800 mb-2">Xem trước:</p>
                            <div className="text-sm text-green-900 space-y-1">
                              {selectedSubjects.slice(0, 3).map((subjectId) => {
                                const subject = allSubjects.find((s) => s.id === subjectId)!;
                                return (
                                  <div key={subjectId}>
                                    • {question.content.replace(/\{name\}/g, subject.name)}
                                  </div>
                                );
                              })}
                              {selectedSubjects.length > 3 && (
                                <div className="text-green-700">...và {selectedSubjects.length - 3} người khác</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Questions Section */}
          {selectedSubjects.length > 0 && (
            <Card className="mb-6 bg-purple-50 border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-purple-900">
                    🎯 Câu hỏi riêng cho từng người
                  </h2>
                  <p className="text-sm text-purple-700 mt-1">
                    Thêm các câu hỏi chỉ dành riêng cho từng người đã chọn
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 flex-wrap border-b border-purple-200">
                  {selectedSubjects.map((subjectId) => {
                    const subject = allSubjects.find((s) => s.id === subjectId)!;
                    const questionCount = (subjectQuestions[subjectId] || []).length;
                    return (
                      <button
                        key={subjectId}
                        onClick={() => setActiveSubjectTab(subjectId)}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                          activeSubjectTab === subjectId
                            ? 'bg-white text-purple-900 border-t-2 border-x-2 border-purple-300'
                            : 'text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        {subject.name}
                        {questionCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-900 text-xs rounded-full">
                            {questionCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                {activeSubjectTab && (
                  <div className="bg-white rounded-lg border border-purple-300 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-purple-900">
                        Câu hỏi cho {allSubjects.find((s) => s.id === activeSubjectTab)?.name}
                      </h3>
                      <Button
                        onClick={() => addQuestionForSubject(activeSubjectTab)}
                        variant="outline"
                        size="sm"
                        icon={<Plus />}
                      >
                        Thêm câu hỏi
                      </Button>
                    </div>

                    {(subjectQuestions[activeSubjectTab] || []).length === 0 && (
                      <div className="text-center py-8 text-gray-500 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300">
                        Chưa có câu hỏi riêng nào. Nhấn "Thêm câu hỏi" để bắt đầu.
                      </div>
                    )}

                    <div className="space-y-4">
                      {(subjectQuestions[activeSubjectTab] || []).map((question, index) => (
                        <div
                          key={question.id}
                          className="bg-purple-50 rounded-lg border border-purple-200 p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-purple-900">
                              Câu hỏi riêng #{index + 1}
                            </span>
                            <Button
                              onClick={() => removeQuestionForSubject(activeSubjectTab, question.id)}
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 />}
                              className="text-red-600 hover:text-red-700"
                            >
                              {''}
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Input
                              label="Nội dung câu hỏi"
                              value={question.content}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateQuestionForSubject(
                                  activeSubjectTab,
                                  question.id,
                                  'content',
                                  e.target.value
                                )
                              }
                              placeholder="Nhập nội dung câu hỏi..."
                              required
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <Select
                                label="Loại câu hỏi"
                                value={question.type}
                                onChange={(e) =>
                                  updateQuestionForSubject(
                                    activeSubjectTab,
                                    question.id,
                                    'type',
                                    e.target.value as any
                                  )
                                }
                                options={[
                                  { value: 'rating-5', label: 'Đánh giá (1-5 sao)' },
                                  { value: 'rating-10', label: 'Đánh giá (1-10 điểm)' },
                                  { value: 'text', label: 'Văn bản' },
                                  { value: 'yes-no', label: 'Có/Không' },
                                  { value: 'ranking', label: 'Sắp xếp thứ hạng' },
                                ]}
                              />

                              <Input
                                label="Mô tả (tùy chọn)"
                                value={question.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateQuestionForSubject(
                                    activeSubjectTab,
                                    question.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Hướng dẫn trả lời..."
                              />
                            </div>

                            {question.type === 'text' && (
                              <Input
                                type="number"
                                label="Số ký tự tối thiểu"
                                value={question.minChars || 500}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateQuestionForSubject(
                                    activeSubjectTab,
                                    question.id,
                                    'minChars',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={() => navigate('/admin/templates')} variant="outline">
          Hủy
        </Button>
        <Button onClick={handleSave} icon={<Save />}>
          Lưu bộ câu hỏi
        </Button>
      </div>
    </div>
  );
};

export default CreateTemplate;
