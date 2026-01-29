import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Trash2, BarChart3, Users, Calendar, Building2, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/ui/StarRating';
import { templatesAPI, evaluationsAPI } from '../../services/api';
import { QuestionTemplate } from '../../types';
import * as XLSX from 'xlsx';

interface Evaluation {
  id: string;
  templateId: string;
  department: string;
  selectedSubjects: string[];
  answers: Record<string, any>;
  subjectDetails?: { id: string; name: string }[];
  submittedAt: string;
  status: string;
}

interface Statistics {
  templateId: string;
  templateName: string;
  totalResponses: number;
  departmentStats: Record<string, number>;
  subjectStats: Record<string, { name: string; totalEvaluations: number; averageRating: string | null }>;
  rankingData: Record<string, { name: string; ranks: Record<number, number> }>;
  evaluations: Evaluation[];
}

const EvaluationHistory: React.FC = () => {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<QuestionTemplate | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('stats');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    if (!templateId) return;
    
    try {
      const [templateRes, statsRes] = await Promise.all([
        templatesAPI.getById(templateId),
        evaluationsAPI.getStatistics(templateId),
      ]);
      
      setTemplate(templateRes.data);
      setStatistics(statsRes.data);
      setEvaluations(statsRes.data.evaluations || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    
    try {
      await evaluationsAPI.delete(id);
      setEvaluations(evaluations.filter(e => e.id !== id));
      alert('Đã xóa đánh giá');
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const handleClearAll = async () => {
    if (!templateId) return;
    if (evaluations.length === 0) {
      alert('Không có đánh giá nào để xóa');
      return;
    }
    
    const confirmMessage = `Bạn có chắc muốn xóa TẤT CẢ ${evaluations.length} đánh giá?\n\nHành động này không thể hoàn tác!`;
    if (!confirm(confirmMessage)) return;
    
    try {
      await evaluationsAPI.deleteAllByTemplate(templateId);
      setEvaluations([]);
      setStatistics(prev => prev ? { ...prev, totalResponses: 0, departmentStats: {}, subjectStats: {}, rankingData: {}, evaluations: [] } : null);
      alert('Đã xóa tất cả đánh giá');
    } catch (error) {
      console.error('Error clearing all evaluations:', error);
      alert('Lỗi khi xóa tất cả đánh giá');
    }
  };

  const exportToExcel = () => {
    if (!template || evaluations.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    // Get all subjects
    const subjects = template.subjects || [];
    // Support cả camelCase và snake_case từ database
    const templateQuestions = (template as any).templateQuestions || (template as any).template_questions || [];
    const commonQuestions = template.questions || [];

    // Build headers
    // STT | Thời gian | Phòng ban | Lãnh đạo | Câu hỏi template 1 | Câu hỏi template 2 | ... | Câu hỏi chung 1 | Xếp hạng | ...
    const headers = [
      'STT',
      'Thời gian',
      'Phòng ban',
      'Lãnh đạo',
    ];
    
    // Add template question headers (per subject)
    templateQuestions.forEach((q: any) => {
      headers.push(q.content.replace(/\{name\}/g, 'Lãnh đạo').trim());
    });
    
    // Add common question headers
    commonQuestions.forEach((q: any) => {
      if (q.type === 'ranking') {
        headers.push('Xếp hạng');
      } else {
        headers.push(q.content);
      }
    });

    // Build data rows
    // Mỗi lượt đánh giá sẽ có nhiều dòng (mỗi lãnh đạo = 1 dòng)
    // STT, Thời gian, Phòng ban chỉ hiện ở dòng đầu tiên
    // Câu hỏi chung chỉ hiện ở dòng đầu tiên (merge cells)
    const data: any[][] = [headers];
    const merges: any[] = [];
    let currentRow = 1; // Row 0 is header

    evaluations.forEach((evaluation, evalIndex) => {
      const selectedIds = evaluation.selectedSubjects || [];
      const numSubjects = selectedIds.length;
      const startRow = currentRow;
      
      // Get common answers
      const commonAnswers: any[] = [];
      commonQuestions.forEach((q: any) => {
        const answerKey = `common-${q.id}`;
        const answer = evaluation.answers[answerKey];
        if (q.type === 'ranking' && typeof answer === 'object') {
          const rankStr = Object.keys(answer)
            .sort((a, b) => Number(a) - Number(b))
            .map(rank => {
              const sid = answer[rank];
              const s = subjects.find(sub => sub.id === sid);
              return `${rank}. ${s?.name || sid}`;
            })
            .join('\n');
          commonAnswers.push(rankStr);
        } else {
          commonAnswers.push(answer || '');
        }
      });
      
      selectedIds.forEach((subjectId, subIndex) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;
        
        const row: any[] = [];
        
        // First row of this evaluation - show STT, time, department
        if (subIndex === 0) {
          row.push(evalIndex + 1);
          row.push(new Date(evaluation.submittedAt).toLocaleString('vi-VN'));
          row.push(evaluation.department || '');
        } else {
          row.push(''); // Empty STT
          row.push(''); // Empty time
          row.push(''); // Empty department
        }
        
        // Subject name
        row.push(subject.name);
        
        // Template question answers for this subject
        templateQuestions.forEach((q: any) => {
          const answerKey = `${subjectId}-tpl-${subjectId}-${q.id}`;
          const answer = evaluation.answers[answerKey];
          row.push(answer || '');
        });
        
        // Common answers - only on first row
        if (subIndex === 0) {
          commonAnswers.forEach(ans => row.push(ans));
        } else {
          commonAnswers.forEach(() => row.push(''));
        }
        
        data.push(row);
        currentRow++;
      });
      
      // Merge cells for STT, Time, Department, and common questions if multiple subjects
      if (numSubjects > 1) {
        // Merge STT (column 0)
        merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow + numSubjects - 1, c: 0 } });
        // Merge Time (column 1)
        merges.push({ s: { r: startRow, c: 1 }, e: { r: startRow + numSubjects - 1, c: 1 } });
        // Merge Department (column 2)
        merges.push({ s: { r: startRow, c: 2 }, e: { r: startRow + numSubjects - 1, c: 2 } });
        
        // Merge common question columns
        const commonStartCol = 4 + templateQuestions.length; // After Lãnh đạo + template questions
        commonQuestions.forEach((_, idx) => {
          merges.push({ 
            s: { r: startRow, c: commonStartCol + idx }, 
            e: { r: startRow + numSubjects - 1, c: commonStartCol + idx } 
          });
        });
      }
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Apply merges
    ws['!merges'] = merges;
    
    // Set column widths
    const colWidths = headers.map((_, i) => {
      if (i === 0) return { wch: 5 }; // STT
      if (i === 1) return { wch: 20 }; // Thời gian
      if (i === 2) return { wch: 20 }; // Phòng ban
      if (i === 3) return { wch: 25 }; // Lãnh đạo
      return { wch: 50 }; // Câu trả lời
    });
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Tổng hợp');
    
    // Generate filename and download
    const fileName = `danh-gia-${template.name.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy bộ câu hỏi</p>
        <Link to="/admin/templates" className="text-purple-600 hover:underline mt-2 inline-block">
          Quay lại
        </Link>
      </div>
    );
  }

  const subjects = template.subjects || [];
  
  // Kiểm tra xem đây có phải template nhân viên không
  const isEmployeeTemplate = (template as any).type === 'nhan-vien';
  
  // Kiểm tra xem đây có phải template đánh giá chung không
  const isGeneralTemplate = (template as any).type === 'chung';
  
  // Lọc subjects theo phòng ban nếu có filter
  const filteredSubjects = filterDepartment
    ? subjects.filter(s => {
        if (!s.department) return false;
        const parts = s.department.split(' - ');
        return parts[0] === filterDepartment;
      })
    : subjects;
  
  // Label động theo loại template
  const subjectLabel = isEmployeeTemplate ? 'nhân viên' : isGeneralTemplate ? 'câu trả lời' : 'lãnh đạo';
  const subjectLabelCapital = isEmployeeTemplate ? 'Nhân viên' : isGeneralTemplate ? 'Người trả lời' : 'Lãnh đạo';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử đánh giá</h1>
            <p className="text-gray-600">{template.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('stats')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'stats' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Thống kê
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Chi tiết
            </button>
          </div>
          
          <Button onClick={exportToExcel} icon={<Download className="w-4 h-4" />}>
            Xuất Excel
          </Button>
          <Button 
            onClick={handleClearAll} 
            variant="danger"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalResponses || 0}</p>
                <p className="text-sm text-gray-600">Tổng đánh giá</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(statistics?.departmentStats || {}).length}
                </p>
                <p className="text-sm text-gray-600">Phòng ban</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                <p className="text-sm text-gray-600">{subjectLabelCapital}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {evaluations.length > 0 
                    ? formatDate(evaluations[0].submittedAt).split(' ')[0]
                    : '-'}
                </p>
                <p className="text-sm text-gray-600">Đánh giá gần nhất</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'stats' ? (
        <>
          {/* Department Stats */}
          {statistics?.departmentStats && Object.keys(statistics.departmentStats).length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Thống kê theo phòng ban</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Nút "Tất cả" để xóa filter */}
                  <button
                    onClick={() => setFilterDepartment(null)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      filterDepartment === null
                        ? 'bg-purple-100 ring-2 ring-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Tất cả</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics?.totalResponses || 0}</p>
                    <p className="text-xs text-gray-500">đánh giá</p>
                  </button>
                  {Object.entries(statistics.departmentStats).map(([dept, count]) => (
                    <button
                      key={dept}
                      onClick={() => setFilterDepartment(dept)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        filterDepartment === dept
                          ? 'bg-purple-100 ring-2 ring-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{dept}</p>
                      <p className="text-2xl font-bold text-purple-600">{count}</p>
                      <p className="text-xs text-gray-500">đánh giá</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Thống kê theo {subjectLabel}</h2>
                {filterDepartment && (
                  <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    🔍 Lọc: {filterDepartment}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">{subjectLabelCapital}</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Số lượt đánh giá</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Xếp hạng 1</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Xếp hạng 2</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Xếp hạng 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((subject) => {
                      const stats = statistics?.subjectStats?.[subject.id];
                      const ranking = statistics?.rankingData?.[subject.id];
                      return (
                        <tr key={subject.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{subject.name}</p>
                            <p className="text-sm text-gray-500">{subject.position}</p>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-700 font-bold rounded-full">
                              {stats?.totalEvaluations || 0}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-700 font-bold rounded-full">
                              {ranking?.ranks?.[1] || 0}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-700 font-bold rounded-full">
                              {ranking?.ranks?.[2] || 0}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-700 font-bold rounded-full">
                              {ranking?.ranks?.[3] || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Text Responses by Subject */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Các đánh giá chi tiết theo {subjectLabel}</h2>
                {filterDepartment && (
                  <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    🔍 Lọc: {filterDepartment}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {filteredSubjects.map((subject) => {
                  // Get all evaluations for this subject
                  const subjectEvaluations = evaluations.filter(e => 
                    e.selectedSubjects?.includes(subject.id)
                  );
                  
                  if (subjectEvaluations.length === 0) return null;
                  
                  // Get template questions
                  // Support cả camelCase và snake_case
                  const templateQuestions = (template as any).templateQuestions || (template as any).template_questions || [];
                  const commonQuestions = template.questions || [];
                  
                  return (
                    <div key={subject.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-bold text-lg">
                            {subject.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                          <p className="text-sm text-gray-500">{subjectEvaluations.length} đánh giá</p>
                        </div>
                      </div>
                      
                      {/* Template Questions for this subject */}
                      {templateQuestions.map((q: any) => {
                        const questionContent = q.content.replace(/\{name\}/g, subject.name);
                        
                        // Get all answers for this question
                        const questionAnswers = subjectEvaluations.map(e => {
                          const answerKey = `${subject.id}-tpl-${subject.id}-${q.id}`;
                          return {
                            department: e.department,
                            answer: e.answers[answerKey],
                            submittedAt: e.submittedAt,
                          };
                        }).filter(a => a.answer);
                        
                        if (questionAnswers.length === 0) return null;
                        
                        return (
                          <div key={q.id} className="mb-6">
                            <p className="text-sm font-medium text-purple-700 mb-3">
                              📝 {questionContent}
                            </p>
                            <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                              {questionAnswers.map((qa, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                  {q.type === 'rating-5' || q.type === 'rating-10' ? (
                                    <StarRating 
                                      value={Number(qa.answer) || 0} 
                                      max={q.type === 'rating-10' ? 10 : 5}
                                      readonly 
                                      size="sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900 whitespace-pre-wrap">{qa.answer}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    {qa.department} • {formatDate(qa.submittedAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Common Questions (non-ranking) */}
                      {commonQuestions.filter(q => q.type !== 'ranking').map((q: any) => {
                        // Get all answers for this common question
                        const questionAnswers = subjectEvaluations.map(e => {
                          const answerKey = `common-${q.id}`;
                          return {
                            department: e.department,
                            answer: e.answers[answerKey],
                            submittedAt: e.submittedAt,
                          };
                        }).filter(a => a.answer);
                        
                        if (questionAnswers.length === 0) return null;
                        
                        return (
                          <div key={q.id} className="mb-6">
                            <p className="text-sm font-medium text-blue-700 mb-3">
                              💬 {q.content}
                            </p>
                            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                              {questionAnswers.map((qa, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                  {q.type === 'rating-5' || q.type === 'rating-10' ? (
                                    <StarRating 
                                      value={Number(qa.answer) || 0} 
                                      max={q.type === 'rating-10' ? 10 : 5}
                                      readonly 
                                      size="sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900 whitespace-pre-wrap">{qa.answer}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    {qa.department} • {formatDate(qa.submittedAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Danh sách đánh giá ({evaluations.length})</h2>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Chưa có đánh giá nào</p>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation, index) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {evaluation.department || 'Không xác định'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Đánh giá: {(evaluation.subjectDetails || []).map(s => s.name).join(', ') || 
                            subjects.filter(s => evaluation.selectedSubjects?.includes(s.id)).map(s => s.name).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(evaluation.submittedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => setSelectedEvaluation(evaluation)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(evaluation.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evaluation Detail Modal */}
      {selectedEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chi tiết đánh giá</h3>
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phòng ban</p>
                  <p className="font-medium">{selectedEvaluation.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian</p>
                  <p className="font-medium">{formatDate(selectedEvaluation.submittedAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Lãnh đạo được đánh giá</p>
                <div className="flex flex-wrap gap-2">
                  {subjects
                    .filter(s => selectedEvaluation.selectedSubjects?.includes(s.id))
                    .map(s => (
                      <span key={s.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {s.name}
                      </span>
                    ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-3">Câu trả lời</p>
                <div className="space-y-4">
                  {Object.entries(selectedEvaluation.answers).map(([key, value]) => {
                    // Parse the key to get question info
                    let questionLabel = key;
                    let displayValue = value;
                    let questionType: string | undefined;
                    
                    if (key.startsWith('common-')) {
                      const commonQ = template.questions?.find(q => key === `common-${q.id}`);
                      questionLabel = commonQ?.content || key;
                      questionType = commonQ?.type;
                      
                      if (commonQ?.type === 'ranking' && typeof value === 'object') {
                        displayValue = Object.entries(value)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([rank, sid]) => {
                            const s = subjects.find(sub => sub.id === sid);
                            return `${rank}. ${s?.name || sid}`;
                          })
                          .join('\n');
                      }
                    } else {
                      // Subject-specific question
                      const parts = key.split('-');
                      const subjectId = parts[0];
                      const subject = subjects.find(s => s.id === subjectId);
                      // Support cả camelCase và snake_case
                      const tplQ = ((template as any).templateQuestions || (template as any).template_questions || []).find((q: any) => 
                        key.includes(q.id)
                      );
                      
                      if (tplQ) {
                        questionLabel = `[${subject?.name}] ${tplQ.content.replace(/\{name\}/g, subject?.name || '')}`;
                        questionType = tplQ.type;
                      }
                    }
                    
                    const isRating = questionType === 'rating-5' || questionType === 'rating-10';
                    const maxStars = questionType === 'rating-10' ? 10 : 5;
                    
                    return (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">{questionLabel}</p>
                        {isRating ? (
                          <StarRating 
                            value={Number(displayValue) || 0} 
                            max={maxStars}
                            readonly 
                            size="sm"
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{String(displayValue)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationHistory;
