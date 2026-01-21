import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Award, Target } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const TemplateTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  const templateTypes = [
    {
      id: 'bld',
      title: 'Đánh giá Ban Lãnh Đạo',
      description: 'Tạo bộ câu hỏi đánh giá cho các thành viên Ban Lãnh Đạo',
      icon: Users,
      color: 'bg-blue-500',
      available: true,
      route: '/admin/templates/new/bld',
    },
    {
      id: 'nhan-vien',
      title: 'Đánh giá Nhân Viên',
      description: 'Tạo bộ câu hỏi đánh giá hiệu quả công việc nhân viên',
      icon: Building2,
      color: 'bg-green-500',
      available: false,
    },
    {
      id: 'du-an',
      title: 'Đánh giá Dự Án',
      description: 'Tạo bộ câu hỏi đánh giá kết quả và tiến độ dự án',
      icon: Target,
      color: 'bg-purple-500',
      available: false,
    },
    {
      id: 'khac',
      title: 'Loại Khác',
      description: 'Tạo bộ câu hỏi tùy chỉnh cho mục đích khác',
      icon: Award,
      color: 'bg-orange-500',
      available: false,
    },
  ];

  const handleSelectType = (type: typeof templateTypes[0]) => {
    if (type.available && type.route) {
      navigate(type.route);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chọn loại bộ câu hỏi
          </h1>
          <p className="text-gray-600">
            Chọn loại bộ câu hỏi bạn muốn tạo để bắt đầu
          </p>
        </div>

        {/* Template Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templateTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                onClick={() => handleSelectType(type)}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  type.available
                    ? 'hover:border-primary-500'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`${type.color} p-3 rounded-lg text-white flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {type.title}
                        </h3>
                        {!type.available && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                            Sắp có
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>

                    {/* Arrow */}
                    {type.available && (
                      <div className="text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/admin/templates')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateTypeSelection;
