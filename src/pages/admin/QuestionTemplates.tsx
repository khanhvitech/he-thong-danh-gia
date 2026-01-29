import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Copy, Power, BarChart3, Users, MousePointer } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { QuestionTemplate } from '../../types';
import { templatesAPI } from '../../services/api';

interface TemplateWithStats extends QuestionTemplate {
  viewCount: number;
  evaluationCount: number;
}

const QuestionTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAllWithStats();
      // Chuyển đổi snake_case sang camelCase
      const templates = response.data.map((t: any) => ({
        ...t,
        isActive: t.is_active ?? t.isActive ?? false,
        createdAt: t.created_at ?? t.createdAt,
        updatedAt: t.updated_at ?? t.updatedAt,
        viewCount: t.viewCount ?? t.view_count ?? 0,
        evaluationCount: t.evaluationCount ?? t.evaluation_count ?? 0,
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

      {/* Templates Table */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy bộ câu hỏi nào</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tên bộ câu hỏi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Loại đánh giá
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Đã đánh giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTemplates.map((template) => {
                  const templateType = (template as any).type || 'bld';
                  return (
                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                      {/* Tên bộ câu hỏi */}
                      <td className="px-4 py-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{template.description}</p>
                        </div>
                      </td>
                      
                      {/* Loại đánh giá */}
                      <td className="px-4 py-4">
                        {templateType === 'nhan-vien' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            👥 Nhân viên
                          </span>
                        ) : templateType === 'chung' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🎯 Đánh giá chung
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👔 BLD
                          </span>
                        )}
                      </td>
                      
                      {/* Lượt xem */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-gray-600">
                          <MousePointer className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{template.viewCount || 0}</span>
                        </div>
                      </td>
                      
                      {/* Số đánh giá */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-gray-600">
                          <Users className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{template.evaluationCount || 0}</span>
                        </div>
                      </td>
                      
                      {/* Trạng thái */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            template.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {template.isActive ? 'Đang mở' : 'Đã tắt'}
                        </button>
                      </td>
                      
                      {/* Cập nhật */}
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(template.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      
                      {/* Thao tác */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/${template.slug || template.id}`} target="_blank">
                            <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} title="Xem trước">
                            </Button>
                          </Link>
                          <Link to={`/admin/templates/${template.id}/edit`}>
                            <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} title="Sửa">
                            </Button>
                          </Link>
                          <Link to={`/admin/templates/${template.id}/history`}>
                            <Button variant="ghost" size="sm" icon={<BarChart3 className="w-4 h-4 text-purple-600" />} title="Lịch sử">
                            </Button>
                          </Link>
                          {template.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Copy className="w-4 h-4" />}
                              title="Copy link"
                              onClick={() => {
                                const slug = template.slug || template.id;
                                const link = `${window.location.origin}/${slug}`;
                                navigator.clipboard.writeText(link);
                                alert('Đã copy link đánh giá!');
                              }}
                            >
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-red-600" />}
                            title="Xóa"
                            onClick={() => handleDelete(template.id)}
                          >
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuestionTemplates;
