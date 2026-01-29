import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { templatesAPI } from '../../services/api';
import CreateTemplate from './CreateTemplate';
import CreateTemplateEmployee from './CreateTemplateEmployee';
import CreateTemplateGeneral from './CreateTemplateGeneral';

export default function EditTemplateWrapper() {
  const { id } = useParams<{ id: string }>();
  const [templateType, setTemplateType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplateType = async () => {
      if (!id) {
        setError('Không tìm thấy ID template');
        setLoading(false);
        return;
      }

      try {
        const response = await templatesAPI.getById(id);
        const template = response.data;
        console.log('EditTemplateWrapper - Template type:', template.type);
        setTemplateType(template.type || 'bld'); // Default to 'bld' for old templates
        setLoading(false);
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Không thể tải thông tin template');
        setLoading(false);
      }
    };

    fetchTemplateType();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render the appropriate component based on template type
  if (templateType === 'nhan-vien') {
    return <CreateTemplateEmployee />;
  }
  
  if (templateType === 'chung') {
    return <CreateTemplateGeneral />;
  }

  // Default to BLD template (for 'bld' or 'other' types)
  return <CreateTemplate />;
}
