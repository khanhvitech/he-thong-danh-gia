
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layouts/AdminLayout';
import QuestionTemplates from './pages/admin/QuestionTemplates';
import TemplateTypeSelection from './pages/admin/TemplateTypeSelection';
import CreateTemplate from './pages/admin/CreateTemplate';
import EvaluationHistory from './pages/admin/EvaluationHistory';
import EvaluationForm from './pages/evaluator/EvaluationForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/templates" replace />} />
          <Route path="templates" element={<QuestionTemplates />} />
          <Route path="templates/new" element={<TemplateTypeSelection />} />
          <Route path="templates/new/bld" element={<CreateTemplate />} />
          <Route path="templates/:id/edit" element={<CreateTemplate />} />
          <Route path="templates/:templateId/history" element={<EvaluationHistory />} />
        </Route>

        {/* Evaluator Routes */}
        <Route path="/evaluate/:templateId" element={<EvaluationForm />} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
