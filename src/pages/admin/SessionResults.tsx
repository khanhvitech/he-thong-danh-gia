import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Star } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = {
  session: {
    name: 'Đánh giá hiệu suất Q4 2025 - Technical Team',
    evaluatorName: 'Nguyễn Văn Manager',
    completedAt: '2026-01-20T14:30:00',
    totalSubjects: 4,
    totalQuestions: 46,
    averageScore: 4.2,
  },
  results: [
    {
      name: 'Nguyễn Văn A',
      position: 'Senior Developer',
      averageScore: 4.2,
      scores: {
        technical: 4,
        codeQuality: 5,
        teamwork: 4,
        communication: 3,
        problemSolving: 5,
      },
      recommendation: 'Khuyến nghị thăng chức',
    },
    {
      name: 'Trần Thị B',
      position: 'Product Manager',
      averageScore: 4.6,
      scores: {
        leadership: 5,
        strategic: 4,
        management: 5,
        communication: 5,
        decision: 4,
      },
      recommendation: 'Rất khuyến nghị thăng chức',
    },
    {
      name: 'Lê Văn C',
      position: 'UX Designer',
      averageScore: 4.4,
      scores: {
        creativity: 5,
        research: 4,
        design: 5,
        collaboration: 4,
      },
      recommendation: 'Khuyến nghị',
    },
    {
      name: 'Phạm Văn D',
      position: 'Junior Developer',
      averageScore: 3.5,
      scores: {
        technical: 3,
        codeQuality: 3,
        teamwork: 4,
        communication: 4,
        learning: 4,
      },
      recommendation: 'Có thể xem xét',
    },
  ],
};

const chartData = mockData.results.map(r => ({
  name: r.name.split(' ').pop(),
  score: r.averageScore,
}));

const SessionResults: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">📊 Kết Quả Đánh Giá</h1>
            <p className="text-gray-600">{mockData.session.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              Export Excel
            </Button>
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              Export PDF
            </Button>
            <Button icon={<Mail className="w-4 h-4" />}>
              Gửi báo cáo
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">📈 Tổng Quan</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Người đánh giá</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.session.evaluatorName}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Số người</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.session.totalSubjects}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tổng câu hỏi</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.session.totalQuestions}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.session.averageScore}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Biểu Đồ Phân Bố Điểm</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" name="Điểm trung bình" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Chi Tiết Từng Người</h2>
          <div className="space-y-4">
            {mockData.results.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.name}</h3>
                      <p className="text-gray-600">{result.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {result.averageScore}/5.0
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(result.averageScore)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-none text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {Object.entries(result.scores).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{key}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(value / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{value}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Recommendation:</p>
                    <p className="font-medium text-gray-900">{result.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionResults;
