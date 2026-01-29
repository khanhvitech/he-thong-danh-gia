import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Building2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { Question, QuestionTemplate, SubjectInTemplate } from '../../types';
import { templatesAPI } from '../../services/api';

// Danh sách phòng ban có sẵn
const AVAILABLE_DEPARTMENTS = [
  'Phòng Kỹ thuật',
  'Phòng Kinh doanh',
  'Phòng Marketing',
  'Phòng Support',
  'Kế toán - HR',
  'Dự án ViLead',
  'Khác'
];

// Interface for department/team structure
interface Department {
  id: string;
  departmentName: string; // Tên phòng (chọn từ dropdown)
  teamName: string; // Tên team (điền tự do, có thể để trống)
  employeesText: string; // Raw text input (one name per line)
}

const CreateTemplateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id: templateId } = useParams();
  const isEditMode = !!templateId;
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Selection question configuration
  const [selectionQuestion, setSelectionQuestion] = useState('Vui lòng chọn những nhân viên mà bạn muốn đánh giá:');
  const [minSelections, setMinSelections] = useState(1);

  // Common questions for everyone
  const [commonQuestions, setCommonQuestions] = useState<Question[]>([]);

  // Departments/Teams with their employees
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  
  // Modal for adding/editing department
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ departmentName: '', teamName: '' });
  
  // Parsed list of all employees from all departments
  const [allSubjects, setAllSubjects] = useState<SubjectInTemplate[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Template questions with {name} variable - applies to all selected subjects
  const [templateQuestions, setTemplateQuestions] = useState<Question[]>([]);

  // Individual questions for each selected subject
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, Question[]>>({});

  // Parse all employees from all departments whenever departments change
  useEffect(() => {
    const subjects: SubjectInTemplate[] = [];
    
    departments.forEach(dept => {
      const lines = dept.employeesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // Tạo tên đầy đủ: "Phòng X - Team Y" hoặc chỉ "Phòng X"
      const fullDeptName = dept.teamName 
        ? `${dept.departmentName} - ${dept.teamName}`
        : dept.departmentName;
      
      lines.forEach((empName, index) => {
        subjects.push({
          id: `${dept.id}-emp-${index + 1}`,
          name: empName,
          position: 'Nhân viên',
          department: fullDeptName,
        });
      });
    });
    
    setAllSubjects(subjects);
    // Auto-select all employees
    setSelectedSubjects(subjects.map(s => s.id));
  }, [departments]);

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
      
      // Fill in selection question settings
      if (template.selectionQuestion || template.selection_question) {
        setSelectionQuestion(template.selectionQuestion || template.selection_question);
      }
      if (template.minSelections || template.min_selections) {
        setMinSelections(template.minSelections || template.min_selections);
      }
      
      // Fill in common questions
      setCommonQuestions(template.questions || []);
      
      // Fill in template questions (with {name} variable)
      const tplQuestions = template.templateQuestions || template.template_questions || [];
      setTemplateQuestions(tplQuestions);
      
      // Reconstruct departments from subjects
      const subjects = template.subjects || [];
      const deptMap: Record<string, string[]> = {};
      
      subjects.forEach((s: SubjectInTemplate) => {
        const deptName = s.department || 'Chưa phân loại';
        if (!deptMap[deptName]) {
          deptMap[deptName] = [];
        }
        deptMap[deptName].push(s.name);
      });
      
      const loadedDepts: Department[] = Object.entries(deptMap).map(([fullName, employees], index) => {
        // Parse "Phòng X - Team Y" format
        const parts = fullName.split(' - ');
        const departmentName = parts[0] || fullName;
        const teamName = parts.length > 1 ? parts.slice(1).join(' - ') : '';
        
        return {
          id: `dept-${index + 1}`,
          departmentName,
          teamName,
          employeesText: employees.join('\n'),
        };
      });
      
      setDepartments(loadedDepts);
      setExpandedDepts(loadedDepts.map(d => d.id));
      
      // Fill in individual subject questions
      const subjectQuestionsArray = template.subjectQuestions || template.subject_questions || [];
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

  // Department management functions
  const handleAddDepartment = () => {
    setEditingDept(null);
    setDeptForm({ departmentName: AVAILABLE_DEPARTMENTS[0], teamName: '' });
    setShowDeptModal(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ departmentName: dept.departmentName, teamName: dept.teamName });
    setShowDeptModal(true);
  };

  const handleSaveDepartment = () => {
    if (!deptForm.departmentName.trim()) {
      alert('Vui lòng chọn phòng ban');
      return;
    }

    if (editingDept) {
      // Update existing department
      setDepartments(departments.map(d => 
        d.id === editingDept.id 
          ? { ...d, departmentName: deptForm.departmentName, teamName: deptForm.teamName }
          : d
      ));
    } else {
      // Add new department
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        departmentName: deptForm.departmentName,
        teamName: deptForm.teamName,
        employeesText: '',
      };
      setDepartments([...departments, newDept]);
      setExpandedDepts([...expandedDepts, newDept.id]);
    }
    setShowDeptModal(false);
  };

  // Helper to get display name for department
  const getDeptDisplayName = (dept: Department) => {
    return dept.teamName 
      ? `${dept.departmentName} - ${dept.teamName}`
      : dept.departmentName;
  };

  const handleDeleteDepartment = (deptId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban/team này và tất cả nhân viên trong đó?')) {
      setDepartments(departments.filter(d => d.id !== deptId));
      setExpandedDepts(expandedDepts.filter(id => id !== deptId));
    }
  };

  const updateDepartmentEmployees = (deptId: string, text: string) => {
    setDepartments(departments.map(d => 
      d.id === deptId 
        ? { ...d, employeesText: text }
        : d
    ));
  };

  const toggleDeptExpand = (deptId: string) => {
    if (expandedDepts.includes(deptId)) {
      setExpandedDepts(expandedDepts.filter(id => id !== deptId));
    } else {
      setExpandedDepts([...expandedDepts, deptId]);
    }
  };

  const getEmployeeCount = (dept: Department) => {
    return dept.employeesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0).length;
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

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên bộ câu hỏi');
      return;
    }

    if (allSubjects.length === 0) {
      alert('Vui lòng nhập danh sách nhân viên cần đánh giá');
      return;
    }

    if (commonQuestions.length === 0 && templateQuestions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    const template: Omit<QuestionTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      type: 'nhan-vien', // Loại template đánh giá nhân viên
      selectionQuestion, // Câu hỏi chọn người tùy chỉnh
      minSelections, // Số người tối thiểu phải chọn
      roles: [],
      questions: commonQuestions,
      subjects: allSubjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        position: subject.position,
        department: subject.department,
      })),
      subjectQuestions: selectedSubjects.map((subjectId) => ({
        subjectId,
        questions: subjectQuestions[subjectId] || [],
      })),
      templateQuestions: templateQuestions,
    };

    try {
      if (isEditMode && templateId) {
        const response = await templatesAPI.update(templateId, template);
        console.log('Template updated:', response.data);
        alert('Đã cập nhật bộ câu hỏi thành công!');
      } else {
        const response = await templatesAPI.create(template);
        console.log('Template saved:', response.data);
        alert('Đã lưu bộ câu hỏi thành công!');
      }
      navigate('/admin/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      const errorMessage = error.response?.data?.error || 'Lỗi khi lưu bộ câu hỏi. Vui lòng thử lại.';
      alert(errorMessage);
    }
  };

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
            {isEditMode ? 'Sửa bộ câu hỏi đánh giá nhân viên' : 'Tạo bộ câu hỏi đánh giá nhân viên'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? 'Chỉnh sửa bộ câu hỏi hiện có' 
              : 'Tạo bộ câu hỏi đánh giá nhân viên với danh sách tên tự do'}
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
              placeholder="Vd: Đánh giá nhân viên Q1/2026"
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
                placeholder="Mô tả ngắn gọn về bộ câu hỏi này"
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

      {/* Departments/Teams Section */}
      <Card className="mb-6 bg-green-50 border-2 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-green-700" />
              <div>
                <h2 className="text-lg font-semibold text-green-900">👥 Danh sách nhân viên theo Phòng ban/Team</h2>
                <p className="text-sm text-green-700 mt-1">
                  Tạo các phòng ban/team và nhập danh sách nhân viên cho mỗi nhóm
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddDepartment}
              variant="primary"
              size="sm"
              icon={<Plus />}
              className="bg-green-600 hover:bg-green-700"
            >
              Thêm Phòng ban/Team
            </Button>
          </div>

          {departments.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-green-300">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Chưa có phòng ban/team nào.</p>
              <p className="text-sm mt-1">Nhấn "Thêm Phòng ban/Team" để bắt đầu.</p>
            </div>
          )}

          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-lg border border-green-300 overflow-hidden">
                {/* Department Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-green-100 cursor-pointer"
                  onClick={() => toggleDeptExpand(dept.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedDepts.includes(dept.id) ? (
                      <ChevronUp className="w-5 h-5 text-green-700" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-green-700" />
                    )}
                    <div>
                      <span className="font-semibold text-green-900">{getDeptDisplayName(dept)}</span>
                      <span className="ml-2 text-sm text-green-700">
                        ({getEmployeeCount(dept)} nhân viên)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDepartment(dept);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Sửa tên"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(dept.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Department Content */}
                {expandedDepts.includes(dept.id) && (
                  <div className="p-4">
                    <Textarea
                      label="Danh sách nhân viên (mỗi dòng 1 người)"
                      value={dept.employeesText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        updateDepartmentEmployees(dept.id, e.target.value)
                      }
                      placeholder={`Nguyễn Văn A\nTrần Thị B\nLê Văn C\n...`}
                      rows={6}
                      className="font-mono"
                    />
                    {getEmployeeCount(dept) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {dept.employeesText
                          .split('\n')
                          .map(line => line.trim())
                          .filter(line => line.length > 0)
                          .slice(0, 8)
                          .map((empName, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                            >
                              {empName}
                            </span>
                          ))}
                        {getEmployeeCount(dept) > 8 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{getEmployeeCount(dept) - 8} người khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {allSubjects.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-900">
                  ✓ Tổng cộng: {allSubjects.length} nhân viên trong {departments.length} phòng ban/team
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Question Settings */}
      <Card className="mb-6 bg-orange-50 border-2 border-orange-200">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-orange-900">⚙️ Cài đặt câu hỏi chọn người đánh giá</h2>
            <p className="text-sm text-orange-700 mt-1">
              Tùy chỉnh câu hỏi và số lượng tối thiểu người cần chọn
            </p>
          </div>

          <div className="bg-white rounded-lg border border-orange-300 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Câu hỏi chọn người đánh giá
              </label>
              <Textarea
                value={selectionQuestion}
                onChange={(e) => setSelectionQuestion(e.target.value)}
                placeholder="Nhập câu hỏi để người dùng chọn người cần đánh giá..."
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ví dụ: "Vui lòng chọn những nhân viên mà bạn đã làm việc cùng trong quý vừa qua"
              </p>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số người tối thiểu phải chọn
              </label>
              <Input
                type="number"
                min={1}
                max={allSubjects.length || 10}
                value={minSelections}
                onChange={(e) => setMinSelections(parseInt(e.target.value) || 1)}
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
                        { value: 'single-choice', label: 'Chọn một' },
                        { value: 'multiple-choice', label: 'Chọn nhiều' },
                        { value: 'yes-no', label: 'Có/Không' },
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

                  {(question.type === 'single-choice' || question.type === 'multiple-choice') && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Các lựa chọn</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(question.options || []), ''];
                            updateCommonQuestion(question.id, 'options', newOptions);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          + Thêm lựa chọn
                        </button>
                      </div>
                      {(question.options || []).map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[optIdx] = e.target.value;
                              updateCommonQuestion(question.id, 'options', newOptions);
                            }}
                            placeholder={`Lựa chọn ${optIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                              updateCommonQuestion(question.id, 'options', newOptions);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={question.allowOther || false}
                          onChange={(e) => updateCommonQuestion(question.id, 'allowOther', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Cho phép điền "Khác"
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Questions Section - Questions with {name} variable */}
      {allSubjects.length > 0 && (
        <Card className="mb-6 bg-purple-50 border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-purple-900">📋 Câu hỏi mẫu cho từng nhân viên</h2>
                <p className="text-sm text-purple-700 mt-1">
                  Câu hỏi này sẽ áp dụng cho tất cả nhân viên. Sử dụng <code className="bg-purple-200 px-1 rounded">{'{name}'}</code> để thay tên người đó.
                </p>
              </div>
              <Button
                onClick={addTemplateQuestion}
                variant="primary"
                size="sm"
                icon={<Plus />}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Thêm câu hỏi mẫu
              </Button>
            </div>

            {templateQuestions.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-purple-300">
                Chưa có câu hỏi mẫu nào. Nhấn "Thêm câu hỏi mẫu" để bắt đầu.
              </div>
            )}

            <div className="space-y-4">
              {templateQuestions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-lg border border-purple-300 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-purple-900">
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
                      <p className="text-xs text-purple-600 mt-1">
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
                          { value: 'single-choice', label: 'Chọn một' },
                          { value: 'multiple-choice', label: 'Chọn nhiều' },
                          { value: 'yes-no', label: 'Có/Không' },
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

                    {(question.type === 'single-choice' || question.type === 'multiple-choice') && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Các lựa chọn</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...(question.options || []), ''];
                              updateTemplateQuestion(question.id, 'options', newOptions);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Thêm lựa chọn
                          </button>
                        </div>
                        {(question.options || []).map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optIdx] = e.target.value;
                                updateTemplateQuestion(question.id, 'options', newOptions);
                              }}
                              placeholder={`Lựa chọn ${optIdx + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                                updateTemplateQuestion(question.id, 'options', newOptions);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={question.allowOther || false}
                            onChange={(e) => updateTemplateQuestion(question.id, 'allowOther', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Cho phép điền "Khác"
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={() => navigate('/admin/templates')} variant="outline">
          Hủy
        </Button>
        <Button onClick={handleSave} icon={<Save />}>
          {isEditMode ? 'Cập nhật' : 'Lưu bộ câu hỏi'}
        </Button>
      </div>

      {/* Modal for adding/editing department */}
      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title={editingDept ? 'Sửa Phòng ban/Team' : 'Thêm Phòng ban/Team mới'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Phòng ban"
            value={deptForm.departmentName}
            onChange={(e) => 
              setDeptForm({ ...deptForm, departmentName: e.target.value })
            }
            options={AVAILABLE_DEPARTMENTS.map(dept => ({ value: dept, label: dept }))}
            required
          />
          <Input
            label="Tên Team (tùy chọn)"
            value={deptForm.teamName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setDeptForm({ ...deptForm, teamName: e.target.value })
            }
            placeholder="Vd: Team Frontend, Team Sales, ..."
          />
          <p className="text-xs text-gray-500">
            💡 Nếu phòng ban có nhiều team, hãy điền tên team để phân biệt. Để trống nếu không có team.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeptModal(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveDepartment} icon={<Save />}>
            {editingDept ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default CreateTemplateEmployee;
