import { Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Textarea } from '../../components/ui/Input';
import { StarRating } from '../../components/ui/StarRating';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { evaluationsAPI, templatesAPI } from '../../services/api';
import { Question, QuestionTemplate } from '../../types';

const DEPARTMENTS = [
  'Phòng Kỹ thuật',
  'Phòng Kinh doanh',
  'Phòng Marketing',
  'Phòng Support',
  'Kế toán - HR',
  'Dự án ViLead'
];

const EvaluationForm: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [template, setTemplate] = useState<QuestionTemplate | null>(null);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepartmentModal, setShowDepartmentModal] = useState(true);
  const [department, setDepartment] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    loadTemplateData();
  }, [slug]);

  const loadTemplateData = async () => {
    try {
      const response = await templatesAPI.getBySlug(slug || '');
      const templateData = response.data;

      // Check if template is active (default to true if not set)
      if (templateData.isActive === false) {
        alert('Bộ câu hỏi này hiện đang tạm dừng nhận đánh giá.');
        navigate('/');
        return;
      }

      setTemplate(templateData);
      
      // Increment view count
      try {
        await templatesAPI.incrementView(slug || '');
      } catch (e) {
        // Silently fail - view count is not critical
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Không tìm thấy bộ câu hỏi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xem đây có phải template nhân viên không
  const isEmployeeTemplate = template?.type === 'nhan-vien';
  
  // Kiểm tra xem đây có phải template đánh giá chung không (không chọn người)
  const isGeneralTemplate = template?.type === 'chung';
  
  // State cho việc chọn phòng ban và team riêng biệt (cho template nhân viên)
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');
  
  // Lấy danh sách phòng ban duy nhất từ subjects (parse từ "Phòng X - Team Y")
  const getAvailableDeptNames = (): string[] => {
    if (!template?.subjects) return [];
    const depts = new Set<string>();
    template.subjects.forEach(s => {
      if (s.department) {
        // Parse "Phòng X - Team Y" -> "Phòng X"
        const parts = s.department.split(' - ');
        depts.add(parts[0]);
      }
    });
    return Array.from(depts).sort();
  };
  
  // Lấy danh sách team trong phòng ban đã chọn
  const getAvailableTeams = (): string[] => {
    if (!template?.subjects || !selectedDeptName) return [];
    const teams = new Set<string>();
    template.subjects.forEach(s => {
      if (s.department) {
        const parts = s.department.split(' - ');
        // Nếu phòng ban khớp và có team
        if (parts[0] === selectedDeptName && parts.length > 1) {
          teams.add(parts.slice(1).join(' - ')); // Phần còn lại là team name
        }
      }
    });
    return Array.from(teams).sort();
  };
  
  const availableDeptNames = getAvailableDeptNames();
  const availableTeams = getAvailableTeams();
  
  // Tính selectedTargetDepartment từ phòng ban và team đã chọn
  const computedTargetDepartment = selectedDeptName 
    ? (selectedTeamName ? `${selectedDeptName} - ${selectedTeamName}` : selectedDeptName)
    : '';

  // Get current subject and their questions
  const allSubjects = template?.subjects || [];
  
  // Lọc subjects theo phòng ban và team đã chọn (chỉ cho template nhân viên)
  const filteredSubjectsByDept = isEmployeeTemplate && selectedDeptName
    ? allSubjects.filter(s => {
        if (!s.department) return false;
        const parts = s.department.split(' - ');
        const deptName = parts[0];
        const teamName = parts.length > 1 ? parts.slice(1).join(' - ') : '';
        
        // Phải khớp phòng ban
        if (deptName !== selectedDeptName) return false;
        
        // Nếu có chọn team thì phải khớp team
        if (selectedTeamName && teamName !== selectedTeamName) return false;
        
        return true;
      })
    : allSubjects;
  
  // Debug log
  try {
    console.log('Debug EvaluationForm:', {
      isEmployeeTemplate,
      selectedDeptName,
      selectedTeamName,
      availableDeptNames,
      availableTeams,
      filteredSubjectsByDeptCount: filteredSubjectsByDept.length,
      showDepartmentModal,
      allSubjectsWithDept: allSubjects.map(s => ({ name: s.name, department: s.department }))
    });
  } catch (e) {
    console.error('Debug log error:', e);
  }
    
  const subjects = selectedSubjects.length > 0
    ? allSubjects.filter(s => selectedSubjects.includes(s.id))
    : allSubjects;
  const currentSubject = subjects[currentSubjectIndex];

  // Get questions for current subject (only template questions with {name} and individual questions)
  const getCurrentSubjectQuestions = (): Question[] => {
    if (!template || !currentSubject) return [];

    // Template questions with {name} variable - replace with current subject name
    // Support cả camelCase và snake_case từ database
    const templateQuestionsRaw = (template as any).templateQuestions || (template as any).template_questions || [];
    const templateQuestions = templateQuestionsRaw.map((q: Question) => ({
      ...q,
      id: `tpl-${currentSubject.id}-${q.id}`,
      content: q.content.replace(/\{name\}/g, currentSubject.name),
      description: q.description?.replace(/\{name\}/g, currentSubject.name),
    }));

    // Individual questions for this subject (check both camelCase and snake_case)
    const subjectQuestionsArray = (template as any).subjectQuestions || (template as any).subject_questions || [];
    const subjectQuestionData = subjectQuestionsArray.find(
      (sq: any) => sq.subjectId === currentSubject.id
    );
    const individualQuestions = subjectQuestionData?.questions || [];

    return [...templateQuestions, ...individualQuestions];
  };

  // Get common questions (asked once after all subjects are evaluated)
  const getCommonQuestions = (): Question[] => {
    if (!template) return [];
    return template.questions || [];
  };

  const currentQuestions = getCurrentSubjectQuestions();
  const totalQuestions = currentQuestions.length;
  const answeredQuestions = Object.keys(answers).filter(key =>
    key.startsWith(`${currentSubject?.id}-`)
  ).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  // Use progress for debugging
  console.debug('Progress:', progress);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSaved(new Date());
      // Save to localStorage or API
      console.log('Auto-saving...', answers);
    }, 30000);
    return () => clearInterval(interval);
  }, [answers]);

  const handleAnswerChange = (questionId: string, value: any) => {
    // Với template chung hoặc câu hỏi common, sử dụng questionId trực tiếp
    if (isGeneralTemplate || questionId.startsWith('common-')) {
      setAnswers({
        ...answers,
        [questionId]: value,
      });
    } else {
      setAnswers({
        ...answers,
        [`${currentSubject?.id}-${questionId}`]: value,
      });
    }
  };

  const getAnswer = (questionId: string) => {
    return answers[`${currentSubject?.id}-${questionId}`] || '';
  };

  const handleNextSubject = () => {
    if (currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  /* Unused for now
  const handlePrevSubject = () => {
    if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  */

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      // Prepare subject details
      const subjectDetails = subjects.map(s => ({ id: s.id, name: s.name }));

      // Submit to API
      await evaluationsAPI.submit({
        templateId: template?.id,
        department,
        selectedSubjects,
        answers,
        subjectDetails,
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setShowConfirmModal(false);
      alert('Có lỗi khi gửi đánh giá. Vui lòng thử lại.');
    }
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const isSubjectCompleted = (index: number) => {
    const subject = subjects[index];
    if (!subject) return false;

    // Get questions for this subject (only template questions with {name} and individual)
    // Support cả camelCase và snake_case từ database
    const templateQuestionsRaw = (template as any)?.templateQuestions || (template as any)?.template_questions || [];
    const subjectQuestionsArray = (template as any)?.subjectQuestions || (template as any)?.subject_questions || [];
    const subjectQuestionData = subjectQuestionsArray.find(
      (sq: any) => sq.subjectId === subject.id
    );
    const individualQuestions = subjectQuestionData?.questions || [];
    const totalQs = templateQuestionsRaw.length + individualQuestions.length;

    const subjectAnswers = Object.keys(answers).filter(key => key.startsWith(`${subject.id}-`));
    return subjectAnswers.length >= totalQs;
  };

  // Check if all subject evaluations are completed (not including common questions)
  const isAllSubjectsCompleted = () => {
    // Với đánh giá chung, không cần chọn người
    if (isGeneralTemplate) return true;
    if (selectedSubjects.length < 2) return false;
    return subjects.every((_, index) => isSubjectCompleted(index));
  };

  // Check if common questions are completed
  const commonQuestions = getCommonQuestions();
  const commonAnswersCount = Object.keys(answers).filter(key => key.startsWith('common-')).length;
  const isCommonQuestionsCompleted = commonAnswersCount >= commonQuestions.length;

  // Check if all subjects are completed
  const isAllCompleted = () => {
    // Với đánh giá chung, chỉ cần hoàn thành common questions
    if (isGeneralTemplate) {
      return isCommonQuestionsCompleted;
    }
    return isAllSubjectsCompleted() && isCommonQuestionsCompleted;
  };

  // Check if current subject is completed
  const isCurrentSubjectCompleted = () => {
    return answeredQuestions === totalQuestions && totalQuestions > 0;
  };

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

  // Person selector modal - Skip this mode

  // Template chung không cần subjects (đánh giá ẩn danh)
  if (!template || (!isGeneralTemplate && allSubjects.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Không tìm thấy bộ câu hỏi</p>
            <Button onClick={() => navigate('/')}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Nếu là template nhân viên nhưng sau khi lọc không còn ai
  if (isEmployeeTemplate && selectedDeptName && !showDepartmentModal && filteredSubjectsByDept.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Không có nhân viên nào trong phòng ban/team đã chọn.
            </p>
            <Button onClick={() => setShowDepartmentModal(true)}>Chọn lại phòng ban</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Department selection modal
  if (showDepartmentModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              {/* ViTech Logo */}
              <div className="flex justify-center mb-4">
                <img src="/logo.png" alt="ViTech Logo" className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{template.name}</h2>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Đánh giá ẩn danh hoàn toàn</span>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div
                  className="text-sm text-blue-800 prose prose-sm prose-blue max-w-none
                    [&_strong]:font-bold [&_strong]:text-blue-900
                    [&_em]:italic [&_em]:text-purple-700
                    [&_p]:mb-2 [&_p:last-child]:mb-0
                    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-2
                    [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-2
                    [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: template.description }}
                />
              </div>
            )}

            {/* Phòng ban của người đánh giá - Cho template BLD dùng DEPARTMENTS, cho template nhân viên dùng availableDeptNames */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phòng ban của bạn <span className="text-red-500">*</span>
              </label>
              {isEmployeeTemplate && availableDeptNames.length > 0 ? (
                <select
                  value={selectedDeptName}
                  onChange={(e) => {
                    setSelectedDeptName(e.target.value);
                    setDepartment(e.target.value); // Sync với department
                    setSelectedTeamName(''); // Reset team khi đổi phòng ban
                    setSelectedSubjects([]); // Reset selection
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {availableDeptNames.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Thông tin này chỉ dùng để thống kê, không ảnh hưởng tới tính ẩn danh
              </p>
            </div>

            {/* Cho template nhân viên: Chọn team (chỉ hiển thị nếu có team) */}
            {isEmployeeTemplate && selectedDeptName && availableTeams.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Team của bạn <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTeamName}
                  onChange={(e) => {
                    setSelectedTeamName(e.target.value);
                    setSelectedSubjects([]); // Reset selection
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">-- Chọn team --</option>
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={() => {
                if (isEmployeeTemplate && availableDeptNames.length > 0) {
                  if (!selectedDeptName) {
                    alert('Vui lòng chọn phòng ban của bạn');
                    return;
                  }
                  if (availableTeams.length > 0 && !selectedTeamName) {
                    alert('Vui lòng chọn team của bạn');
                    return;
                  }
                } else if (!department) {
                  alert('Vui lòng chọn phòng ban của bạn');
                  return;
                }
                setShowDepartmentModal(false);
              }}
              disabled={(isEmployeeTemplate && availableDeptNames.length > 0) 
                ? (!selectedDeptName || (availableTeams.length > 0 && !selectedTeamName))
                : !department
              }
              className="w-full py-3"
            >
              Tiếp tục
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
    // Reset to first tab when selection changes
    setCurrentSubjectIndex(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* ViTech Logo */}
              <img src="/logo.png" alt="ViTech Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{template.name}</h1>
                <p className="text-xs text-gray-600">Phòng ban: {department}</p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!isAllCompleted()}>
              Gửi đánh giá
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Cho đánh giá chung: Hiển thị trực tiếp các câu hỏi */}
        {isGeneralTemplate ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Câu hỏi khảo sát</h2>
              <div className="space-y-6">
                {(template.questions || []).map((question, index) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.content}
                    </p>
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                    )}
                    
                    {/* Rating Question (5 stars) */}
                    {(question.type === 'rating' || question.type === 'rating-5') && (
                      <StarRating
                        value={answers[`common-${question.id}`] || 0}
                        onChange={(value) => handleAnswerChange(`common-${question.id}`, value)}
                      />
                    )}
                    
                    {/* Text Question */}
                    {question.type === 'text' && (
                      <Textarea
                        value={answers[`common-${question.id}`] || ''}
                        onChange={(e) => handleAnswerChange(`common-${question.id}`, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        rows={3}
                      />
                    )}
                    
                    {/* Yes/No Question */}
                    {(question.type === 'yesno' || question.type === 'yes-no') && (
                      <div className="flex gap-4">
                        <label className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[`common-${question.id}`] === 'yes' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={answers[`common-${question.id}`] === 'yes'}
                            onChange={() => handleAnswerChange(`common-${question.id}`, 'yes')}
                            className="hidden"
                          />
                          <span className="text-green-600">✓</span> Có
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[`common-${question.id}`] === 'no' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}>
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={answers[`common-${question.id}`] === 'no'}
                            onChange={() => handleAnswerChange(`common-${question.id}`, 'no')}
                            className="hidden"
                          />
                          <span className="text-red-600">✗</span> Không
                        </label>
                      </div>
                    )}
                    
                    {/* Scale Question (1-10) */}
                    {(question.type === 'scale' || question.type === 'rating-10') && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleAnswerChange(`common-${question.id}`, num)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              answers[`common-${question.id}`] === num
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Single Choice Question */}
                    {question.type === 'single-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label 
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              answers[`common-${question.id}`] === option 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={answers[`common-${question.id}`] === option}
                              onChange={() => handleAnswerChange(`common-${question.id}`, option)}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              answers[`common-${question.id}`] === option 
                                ? 'border-purple-500 bg-purple-500' 
                                : 'border-gray-300'
                            }`}>
                              {answers[`common-${question.id}`] === option && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {/* Multiple Choice Question */}
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const currentAnswers = answers[`common-${question.id}`] || [];
                          const isSelected = Array.isArray(currentAnswers) && currentAnswers.includes(option);
                          return (
                            <label 
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const current = Array.isArray(currentAnswers) ? currentAnswers : [];
                                  if (isSelected) {
                                    handleAnswerChange(`common-${question.id}`, current.filter(a => a !== option));
                                  } else {
                                    handleAnswerChange(`common-${question.id}`, [...current, option]);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
        {/* Section 1: Person Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-gray-700 mb-1">
              <span className="font-medium">1. {template.selectionQuestion || 'Anh/Chị đã có đủ trải nghiệm làm việc hoặc tương tác để chia sẻ góc nhìn với những lãnh đạo nào dưới đây?'}</span>
            </p>
            <p className="text-orange-600 font-medium mb-4">
              👉 Vui lòng chọn ít nhất {template.minSelections || 2} người
            </p>

            {/* Cho template nhân viên: Hiển thị phòng ban/team đã chọn */}
            {isEmployeeTemplate && selectedDeptName && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">
                  📍 Phòng ban: {selectedDeptName}
                  {selectedTeamName && <span> - Team: {selectedTeamName}</span>}
                </p>
              </div>
            )}

            {/* Selection count badge */}
            {selectedSubjects.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Đã chọn {selectedSubjects.length} người
                </p>
              </div>
            )}

            {/* Danh sách người để chọn - lọc theo phòng ban nếu là template nhân viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubjectsByDept.map((subject) => (
                <label
                  key={subject.id}
                  className={`flex items-center justify-between px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedSubjects.includes(subject.id)
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">{subject.name}</span>
                      {subject.position && (
                        <span className="block text-xs text-gray-500">{subject.position}</span>
                      )}
                    </div>
                  </div>
                  {isEmployeeTemplate && subject.department && !computedTargetDepartment && (
                    <span className="text-xs text-gray-400 ml-2">{subject.department}</span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Questions for selected people - Using Tabs like CreateTemplate */}
        {selectedSubjects.length >= (template.minSelections || 2) && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                📝 Câu hỏi đánh giá cho từng người
              </h2>
              <p className="text-gray-600 mb-4">
                Trả lời các câu hỏi cho từng người đã chọn
              </p>

              {/* Tabs - Same style as CreateTemplate */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {subjects.map((subject, index) => {
                  const subjectAnswerCount = Object.keys(answers).filter(key => key.startsWith(`${subject.id}-`)).length;
                  const subjectTotalQuestions = getCurrentSubjectQuestions().length;

                  return (
                    <button
                      key={subject.id}
                      onClick={() => setCurrentSubjectIndex(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        currentSubjectIndex === index
                          ? 'bg-purple-100 text-purple-900 border-2 border-purple-600'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {subject.name}
                      {subjectAnswerCount > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          subjectAnswerCount === subjectTotalQuestions
                            ? 'bg-green-500 text-white'
                            : 'bg-orange-500 text-white'
                        }`}>
                          {subjectAnswerCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Current Subject Questions */}
              {currentSubject && (
                <div>
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900">
                      Câu hỏi cho {currentSubject.name}
                    </h3>
                    <p className="text-sm text-purple-700">
                      Đã trả lời: {answeredQuestions}/{totalQuestions} câu
                    </p>
                  </div>

                  {/* Questions */}
                  <div className="space-y-6">
                    {currentQuestions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          {index + 1}. {question.content}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        {question.description && (
                          <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                        )}

                        {question.type === 'rating-5' && (
                          <StarRating
                            value={getAnswer(question.id) || 0}
                            onChange={(value) => handleAnswerChange(question.id, value)}
                            max={5}
                          />
                        )}

                        {question.type === 'text' && (
                          <Textarea
                            value={getAnswer(question.id)}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Nhập câu trả lời của bạn..."
                            rows={4}
                            showCharCount
                          />
                        )}

                        {question.type === 'single-choice' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <label key={optIndex} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`${currentSubject.id}-${question.id}`}
                                  value={option}
                                  checked={getAnswer(question.id) === option || (getAnswer(question.id)?.startsWith?.('other:') && option === '__other__')}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="ml-3 text-gray-700">{option}</span>
                              </label>
                            ))}
                            {question.allowOther && (
                              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${currentSubject.id}-${question.id}`}
                                    checked={getAnswer(question.id)?.startsWith?.('other:')}
                                    onChange={() => handleAnswerChange(question.id, 'other:')}
                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="ml-3 text-gray-700">Khác:</span>
                                </label>
                                {getAnswer(question.id)?.startsWith?.('other:') && (
                                  <input
                                    type="text"
                                    value={getAnswer(question.id)?.replace('other:', '') || ''}
                                    onChange={(e) => handleAnswerChange(question.id, `other:${e.target.value}`)}
                                    placeholder="Nhập câu trả lời khác..."
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {question.type === 'multiple-choice' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => {
                              const currentAnswer = getAnswer(question.id) || [];
                              const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
                              return (
                                <label key={optIndex} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedOptions.includes(option)}
                                    onChange={(e) => {
                                      let newSelected = [...selectedOptions.filter((o: string) => !o.startsWith?.('other:') || o !== option)];
                                      if (e.target.checked) {
                                        newSelected.push(option);
                                      } else {
                                        newSelected = newSelected.filter((o: string) => o !== option);
                                      }
                                      handleAnswerChange(question.id, newSelected);
                                    }}
                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                                  />
                                  <span className="ml-3 text-gray-700">{option}</span>
                                </label>
                              );
                            })}
                            {question.allowOther && (
                              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(getAnswer(question.id) || []).some?.((o: string) => o.startsWith?.('other:'))}
                                    onChange={(e) => {
                                      const currentAnswer = getAnswer(question.id) || [];
                                      let newSelected = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                      if (e.target.checked) {
                                        newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                        newSelected.push('other:');
                                      } else {
                                        newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                      }
                                      handleAnswerChange(question.id, newSelected);
                                    }}
                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                                  />
                                  <span className="ml-3 text-gray-700">Khác:</span>
                                </label>
                                {(getAnswer(question.id) || []).some?.((o: string) => o.startsWith?.('other:')) && (
                                  <input
                                    type="text"
                                    value={(getAnswer(question.id) || []).find?.((o: string) => o.startsWith?.('other:'))?.replace('other:', '') || ''}
                                    onChange={(e) => {
                                      const currentAnswer = getAnswer(question.id) || [];
                                      let newSelected = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                      newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                      newSelected.push(`other:${e.target.value}`);
                                      handleAnswerChange(question.id, newSelected);
                                    }}
                                    placeholder="Nhập câu trả lời khác..."
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {question.type === 'ranking' && (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-2">
                              Xếp hạng theo thứ tự ưu tiên (1 = cao nhất)
                            </p>
                            {(() => {
                              const rankingAnswer = getAnswer(question.id) || {};

                              return subjects.map((_, rankIndex) => {
                                const currentRank = rankIndex + 1;
                                const currentSelection = rankingAnswer[currentRank];

                                // Get available options: not selected in earlier ranks
                                const earlierSelections = Object.entries(rankingAnswer)
                                  .filter(([rank]) => parseInt(rank) < currentRank)
                                  .map(([_, value]) => value);

                                const availableOptions = subjects.filter(
                                  s => !earlierSelections.includes(s.id) || s.id === currentSelection
                                );

                                return (
                                  <div key={rankIndex} className="flex items-center gap-3">
                                    <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-800 font-bold rounded-full">
                                      {currentRank}
                                    </span>
                                    <select
                                      value={currentSelection || ''}
                                      onChange={(e) => {
                                        const newRanking = { ...rankingAnswer };
                                        if (e.target.value) {
                                          newRanking[currentRank] = e.target.value;
                                        } else {
                                          delete newRanking[currentRank];
                                        }
                                        handleAnswerChange(question.id, newRanking);
                                      }}
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                      <option value="">-- Chọn người --</option>
                                      {availableOptions.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                          {subject.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation buttons at the end of questions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {isCurrentSubjectCompleted() ? (
                      currentSubjectIndex < subjects.length - 1 ? (
                        <div className="flex items-center justify-between">
                          <p className="text-green-600 font-medium">
                            ✓ Đã hoàn thành đánh giá cho {currentSubject.name}
                          </p>
                          <Button onClick={handleNextSubject}>
                            Tiếp tục đánh giá {subjects[currentSubjectIndex + 1]?.name} →
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <p className="text-green-800 font-semibold text-lg mb-2">
                            🎉 Tuyệt vời! Bạn đã hoàn thành đánh giá cho tất cả {subjects.length} người!
                          </p>
                          <p className="text-green-700">
                            👇 Vui lòng tiếp tục trả lời một vài câu hỏi chung bên dưới để hoàn tất khảo sát.
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-orange-600 font-medium text-center">
                        ⚠️ Vui lòng trả lời tất cả {totalQuestions} câu hỏi để tiếp tục ({answeredQuestions}/{totalQuestions} đã hoàn thành)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 3: Common Questions - Asked once after all subjects are evaluated */}
        {selectedSubjects.length >= (template.minSelections || 2) && isAllSubjectsCompleted() && commonQuestions.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                📋 Câu hỏi chung
              </h2>
              <p className="text-gray-600 mb-4">
                Một vài câu hỏi tổng hợp cuối cùng trước khi hoàn tất khảo sát
              </p>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Đã trả lời: {commonAnswersCount}/{commonQuestions.length} câu
                </p>
              </div>

              <div className="space-y-6">
                {commonQuestions.map((question, index) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {index + 1}. {question.content}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                    )}

                    {question.type === 'rating-5' && (
                      <StarRating
                        value={answers[`common-${question.id}`] || 0}
                        onChange={(value) => setAnswers({...answers, [`common-${question.id}`]: value})}
                        max={5}
                      />
                    )}

                    {question.type === 'text' && (
                      <Textarea
                        value={answers[`common-${question.id}`] || ''}
                        onChange={(e) => setAnswers({...answers, [`common-${question.id}`]: e.target.value})}
                        placeholder="Nhập câu trả lời của bạn..."
                        rows={4}
                        showCharCount
                      />
                    )}

                    {question.type === 'single-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`common-${question.id}`}
                              value={option}
                              checked={answers[`common-${question.id}`] === option || (answers[`common-${question.id}`]?.startsWith?.('other:') && false)}
                              onChange={(e) => setAnswers({...answers, [`common-${question.id}`]: e.target.value})}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                        {question.allowOther && (
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`common-${question.id}`}
                                checked={answers[`common-${question.id}`]?.startsWith?.('other:')}
                                onChange={() => setAnswers({...answers, [`common-${question.id}`]: 'other:'})}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="ml-3 text-gray-700">Khác:</span>
                            </label>
                            {answers[`common-${question.id}`]?.startsWith?.('other:') && (
                              <input
                                type="text"
                                value={answers[`common-${question.id}`]?.replace('other:', '') || ''}
                                onChange={(e) => setAnswers({...answers, [`common-${question.id}`]: `other:${e.target.value}`})}
                                placeholder="Nhập câu trả lời khác..."
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const currentAnswer = answers[`common-${question.id}`] || [];
                          const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
                          return (
                            <label key={optIndex} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedOptions.includes(option)}
                                onChange={(e) => {
                                  let newSelected = [...selectedOptions];
                                  if (e.target.checked) {
                                    newSelected.push(option);
                                  } else {
                                    newSelected = newSelected.filter((o: string) => o !== option);
                                  }
                                  setAnswers({...answers, [`common-${question.id}`]: newSelected});
                                }}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                              />
                              <span className="ml-3 text-gray-700">{option}</span>
                            </label>
                          );
                        })}
                        {question.allowOther && (
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(answers[`common-${question.id}`] || []).some?.((o: string) => o.startsWith?.('other:'))}
                                onChange={(e) => {
                                  const currentAnswer = answers[`common-${question.id}`] || [];
                                  let newSelected = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                  if (e.target.checked) {
                                    newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                    newSelected.push('other:');
                                  } else {
                                    newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                  }
                                  setAnswers({...answers, [`common-${question.id}`]: newSelected});
                                }}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                              />
                              <span className="ml-3 text-gray-700">Khác:</span>
                            </label>
                            {(answers[`common-${question.id}`] || []).some?.((o: string) => o.startsWith?.('other:')) && (
                              <input
                                type="text"
                                value={(answers[`common-${question.id}`] || []).find?.((o: string) => o.startsWith?.('other:'))?.replace('other:', '') || ''}
                                onChange={(e) => {
                                  const currentAnswer = answers[`common-${question.id}`] || [];
                                  let newSelected = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                  newSelected = newSelected.filter((o: string) => !o.startsWith?.('other:'));
                                  newSelected.push(`other:${e.target.value}`);
                                  setAnswers({...answers, [`common-${question.id}`]: newSelected});
                                }}
                                placeholder="Nhập câu trả lời khác..."
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === 'ranking' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 mb-2">
                          Xếp hạng theo thứ tự ưu tiên (1 = cao nhất)
                        </p>
                        {(() => {
                          const rankingAnswer = answers[`common-${question.id}`] || {};

                          return allSubjects.map((_, rankIndex) => {
                            const currentRank = rankIndex + 1;
                            const currentSelection = rankingAnswer[currentRank];

                            // Get available options: not selected in earlier ranks
                            const earlierSelections = Object.entries(rankingAnswer)
                              .filter(([rank]) => parseInt(rank) < currentRank)
                              .map(([_, value]) => value);

                            const availableOptions = allSubjects.filter(
                              s => !earlierSelections.includes(s.id) || s.id === currentSelection
                            );

                            return (
                              <div key={rankIndex} className="flex items-center gap-3">
                                <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-800 font-bold rounded-full">
                                  {currentRank}
                                </span>
                                <select
                                  value={currentSelection || ''}
                                  onChange={(e) => {
                                    const newRanking = { ...rankingAnswer };
                                    if (e.target.value) {
                                      newRanking[currentRank] = e.target.value;
                                    } else {
                                      delete newRanking[currentRank];
                                    }
                                    setAnswers({...answers, [`common-${question.id}`]: newRanking});
                                  }}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="">-- Chọn người --</option>
                                  {availableOptions.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit section */}
              {isCommonQuestionsCompleted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-semibold text-lg mb-2">
                    🎉 Đã hoàn thành tất cả đánh giá!
                  </p>
                  <p className="text-green-700 mb-4">
                    Nhấn "Gửi đánh giá" ở trên để hoàn tất.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận gửi đánh giá"
        message="Bạn có chắc chắn muốn gửi đánh giá?"
        confirmText="Gửi đánh giá"
        cancelText="Quay lại"
      />
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Gửi thành công! 🎉"
        message="Đánh giá của bạn đã được ghi nhận!"
        subMessage="Cảm ơn bạn đã dành thời gian tham gia khảo sát. Phản hồi của bạn rất quan trọng với chúng tôi."
      />
    </div>
  );
};

export default EvaluationForm;
