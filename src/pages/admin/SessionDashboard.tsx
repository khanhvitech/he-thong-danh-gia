import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Mail, Copy, XCircle, Check } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EvaluationSession } from '../../types';
import { sessionsAPI } from '../../services/api';

const SessionDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<EvaluationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await sessionsAPI.getAll();
      setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    const labels = {
      completed: 'Đã hoàn thành',
      'in-progress': 'Đang tiến hành',
      pending: 'Đang chờ',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const copyLink = (sessionId: string, link: string) => {
    if (!link) {
      alert('Link không tồn tại');
      return;
    }
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const previewEvaluation = (token: string) => {
    if (!token) {
      alert('Token không tồn tại');
      return;
    }
    const link = `${window.location.origin}/e/${token}`;
    window.open(link, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Quản Lý Phiên Đánh Giá</h1>
        <p className="text-gray-600">Theo dõi và quản lý các phiên đánh giá</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Tìm kiếm phiên đánh giá..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Đang chờ</option>
          <option value="in-progress">Đang tiến hành</option>
          <option value="completed">Đã hoàn thành</option>
        </select>
        <Link to="/admin/sessions/new">
          <Button icon={<Plus className="w-4 h-4" />}>
            Tạo phiên mới
          </Button>
        </Link>
      </div>

      {/* Sessions List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Đang tải...</p>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy phiên đánh giá nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                      {getStatusBadge(session.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{session.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Người đánh giá:</p>
                        <p className="font-medium">{session.evaluatorName}</p>
                        <p className="text-gray-600">{session.evaluatorEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Hạn hoàn thành:</p>
                        <p className="font-medium">
                          {new Date(session.deadline).toLocaleString('vi-VN')}
                        </p>
                        {session.status === 'pending' && (
                          <p className="text-yellow-600 text-xs mt-1">
                            Còn 10 ngày
                          </p>
                        )}
                      </div>
                    </div>
                    {session.status === 'completed' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ Hoàn thành: {new Date(session.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {session.status === 'completed' ? (
                      <>
                        <Link to={`/admin/sessions/${session.id}/results`}>
                          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                            Xem kết quả
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Copy className="w-4 h-4" />}
                        >
                          Export
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={copiedId === session.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const link = `${window.location.origin}/e/${session.token || ''}`;
                            console.log('Copy link:', link);
                            copyLink(session.id, link);
                          }}
                        >
                          {copiedId === session.id ? 'Đã copy' : 'Copy link'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Preview token:', session.token);
                            previewEvaluation(session.token || '');
                          }}
                        >
                          Xem trước
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Mail className="w-4 h-4" />}
                        >
                          Nhắc nhở
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<XCircle className="w-4 h-4 text-red-600" />}
                        >
                          Hủy phiên
                        </Button>
                      </>
                    )}
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

export default SessionDashboard;
