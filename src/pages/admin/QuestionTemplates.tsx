import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Copy, Power, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { QuestionTemplate } from '../../types';
import { templatesAPI } from '../../services/api';

const QuestionTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      // Chuyển đổi snake_case sang camelCase
      const templates = response.data.map((t: any) => ({
        ...t,
        isActive: t.is_active ?? t.isActive ?? false,
        createdAt: t.created_at ?? t.createdAt,
        updatedAt: t.updated_at ?? t.updatedAt,
      }));
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: QuestionTemplate) => {
    const newStatus = !(template.isActive);
    try {
      await templatesAPI.update(template.id, { ...template, isActive: newStatus });
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, isActive: newStatus } : t
      ));
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bộ câu hỏi này?')) return;
    
    try {
      await templatesAPI.delete(id);
      setTemplates(templates.filter(t => t.id !== id));
      alert('Đã xóa bộ câu hỏi thành công!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Lỗi khi xóa bộ câu hỏi');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 Quản Lý Bộ Câu Hỏi</h1>
        <p className="text-gray-600">Tạo và quản lý các template câu hỏi để sử dụng cho đánh giá</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Tìm kiếm bộ câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Link to="/admin/templates/new">
          <Button icon={<Plus className="w-4 h-4" />}>
            Tạo bộ câu hỏi mới
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy bộ câu hỏi nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      {template.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Đang mở
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                          Đã tắt
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {template.roles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Cập nhật: {new Date(template.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {/* Toggle Active Button */}
                    <Button
                      variant={template.isActive ? "primary" : "outline"}
                      size="sm"
                      icon={<Power className="w-4 h-4" />}
                      onClick={() => handleToggleActive(template)}
                      className={template.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {template.isActive ? 'Tắt' : 'Bật'}
                    </Button>
                    
                    <Link to={`/${template.slug || template.id}`} target="_blank">
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                        Xem trước
                      </Button>
                    </Link>
                    <Link to={`/admin/templates/${template.id}/edit`}>
                      <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />}>
                        Sửa
                      </Button>
                    </Link>
                    <Link to={`/admin/templates/${template.id}/history`}>
                      <Button variant="ghost" size="sm" icon={<BarChart3 className="w-4 h-4 text-purple-600" />}>
                        Lịch sử
                      </Button>
                    </Link>
                    {template.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Copy className="w-4 h-4" />}
                        onClick={() => {
                          const slug = template.slug || template.id;
                          const link = `${window.location.origin}/${slug}`;
                          navigator.clipboard.writeText(link);
                          alert('Đã copy link đánh giá!');
                        }}
                      >
                        Copy link
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-600" />}
                      onClick={() => handleDelete(template.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionTemplates;
