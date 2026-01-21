import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Clock, Users, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { sessionsAPI, templatesAPI } from '../../services/api';
import type { Session, Template } from '../../types';

const DEPARTMENTS = [
  'Phòng Kinh doanh',
  'Phòng Kỹ thuật',
  'Phòng Sản xuất',
  'Phòng Nhân sự',
  'Phòng Marketing',
  'Phòng Tài chính',
  'Phòng Hành chính',
  'Ban Giám đốc',
  'Phòng ban khác'
];

const EvaluationLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');

  useEffect(() => {
    loadSessionData();
  }, [token]);

  const loadSessionData = async () => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      // Load session by token
      const sessionResponse = await sessionsAPI.getByToken(token);
      const sessionData = sessionResponse.data;
      setSession(sessionData);

      // Load template
      const templatesResponse = await templatesAPI.getAll();
      const templates = templatesResponse.data;
      const matchingTemplate = templates.find((t: any) => t.id === sessionData.templateId);
      
      if (matchingTemplate) {
        setTemplate(matchingTemplate);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Không tìm thấy phiên đánh giá hoặc link đã hết hạn');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = () => {
    if (!department) {
      alert('Vui lòng chọn phòng ban của bạn');
      return;
    }

    // Store department in localStorage
    localStorage.setItem('evaluator_department', department);
    
    // Navigate to form
    navigate(`/e/${token}/form`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!session || !template) {
    return null;
  }

  const totalQuestions = template.questions?.length || 0;
  const totalSubjects = template.subjects?.length || 0;
  const estimatedMinutes = totalQuestions * totalSubjects * 0.5; // Estimate 30 seconds per question

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {session.name}
          </h1>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Đánh giá ẩn danh hoàn toàn</span>
          </div>
        </div>

        {/* Description Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 space-y-3">
                {template.description.split('\n').filter((line: string) => line.trim()).map((paragraph: string, index: number) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{totalSubjects}</div>
              <div className="text-sm text-purple-700">Người cần đánh giá</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{totalQuestions}</div>
              <div className="text-sm text-blue-700">Câu hỏi mỗi người</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">~{Math.ceil(estimatedMinutes)}</div>
              <div className="text-sm text-green-700">Phút ước tính</div>
            </CardContent>
          </Card>
        </div>

        {/* Department Selection */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Phòng ban của bạn <span className="text-red-500">*</span>
            </label>
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
            <p className="text-xs text-gray-500 mt-2">
              Thông tin này chỉ dùng để thống kê, không ảnh hưởng tới tính ẩn danh của bạn
            </p>
          </CardContent>
        </Card>

        {/* Deadline Info */}
        {session.deadline && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              <p>
                <span className="font-medium">Hạn chót:</span>{' '}
                {new Date(session.deadline).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        )}

        {/* Start Button */}
        <Button
          onClick={handleStartEvaluation}
          disabled={!department}
          className="w-full py-4 text-lg"
          icon={<ArrowRight className="w-5 h-5" />}
        >
          Bắt đầu đánh giá
        </Button>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Cam kết bảo mật:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Câu trả lời của bạn hoàn toàn ẩn danh</li>
                <li>Không ai biết được bạn đã đánh giá như thế nào</li>
                <li>Dữ liệu chỉ được sử dụng để phát triển chung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationLanding;
