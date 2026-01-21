import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { sessionsAPI, templatesAPI } from '../../services/api';
import { QuestionTemplate } from '../../types';

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [evaluatorEmail, _setEvaluatorEmail] = useState('');
  const [evaluatorName, _setEvaluatorName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [loading, setLoading] = useState(false);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !selectedTemplateId || !deadline) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    
    try {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      
      const sessionData = {
        id: `session-${Date.now()}`,
        name: sessionName,
        description: sessionDescription,
        evaluatorEmail: evaluatorEmail || '',
        evaluatorName: evaluatorName || '',
        deadline: `${deadline}T${deadlineTime}:00`,
        subjects: selectedTemplate?.subjects || [],
        status: 'pending',
      };

      const response = await sessionsAPI.create(sessionData);
      // Session created successfully
      void response.data;
      
      alert('Đã tạo phiên đánh giá thành công!');
      navigate('/admin/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Lỗi khi tạo phiên đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/admin/sessions')}
          >
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">📝 Tạo Phiên Đánh Giá</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Selection */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">1. Chọn bộ câu hỏi</h2>
            <Select
              label="Bộ câu hỏi"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              required
              options={[
                { value: '', label: '-- Chọn bộ câu hỏi --' },
                ...templates.map(t => ({ value: t.id, label: t.name }))
              ]}
            />
            
            {selectedTemplate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Mô tả:</strong> {selectedTemplate.description || 'Không có mô tả'}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Số người cần đánh giá:</strong> {selectedTemplate.subjects?.length || 0} người
                </p>
                {selectedTemplate.subjects && selectedTemplate.subjects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Danh sách:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTemplate.subjects.map(subject => (
                        <span key={subject.id} className="px-2 py-1 bg-white text-sm rounded border border-blue-200">
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">2. Thông tin đánh giá</h2>
            <div className="space-y-4">
              <Input
                label="Tên phiên đánh giá"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Vd: Đánh giá lãnh đạo Q1/2024"
                required
              />
              
              <Textarea
                label="Mô tả (tùy chọn)"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Thêm mô tả về phiên đánh giá này..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deadline */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">3. Thời hạn đánh giá</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ngày hết hạn"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              
              <Input
                label="Giờ hết hạn"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            onClick={() => navigate('/admin/sessions')}
            variant="outline"
          >
            Hủy
          </Button>
          
          <Button
            onClick={handleCreateSession}
            icon={<Send className="w-4 h-4" />}
            disabled={loading || !sessionName || !selectedTemplateId || !deadline}
          >
            {loading ? 'Đang tạo...' : 'Tạo phiên đánh giá'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;
