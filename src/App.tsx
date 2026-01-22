
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import Login from './pages/Login';
import QuestionTemplates from './pages/admin/QuestionTemplates';
import TemplateTypeSelection from './pages/admin/TemplateTypeSelection';
import CreateTemplate from './pages/admin/CreateTemplate';
import EvaluationHistory from './pages/admin/EvaluationHistory';
import EvaluationForm from './pages/evaluator/EvaluationForm';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login Route - Public */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/templates" replace />} />
            <Route path="templates" element={<QuestionTemplates />} />
            <Route path="templates/new" element={<TemplateTypeSelection />} />
            <Route path="templates/new/bld" element={<CreateTemplate />} />
            <Route path="templates/:id/edit" element={<CreateTemplate />} />
            <Route path="templates/:templateId/history" element={<EvaluationHistory />} />
          </Route>

          {/* Evaluator Routes - Public (cho người đánh giá) */}
          <Route path="/:slug" element={<EvaluationForm />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
