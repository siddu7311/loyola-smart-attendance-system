import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import FacultyDashboard from '@/pages/FacultyDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import ContactNew from '@/pages/ContactNew';
import CameraTestPage from '@/pages/CameraTestPage';
import NotFound from '@/pages/NotFound';
// Temporarily comment out problematic imports
// import ModelSetupPage from '@/pages/ModelSetupPage';
// import ModelSetupLink from '@/components/ModelSetupLink';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/contact" element={<ContactNew />} />
        <Route path="/camera-test" element={<CameraTestPage />} />
        {/* Temporarily comment out problematic routes */}
        {/* <Route path="/model-setup" element={<ModelSetupPage />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Temporarily comment out problematic components */}
      {/* <ModelSetupLink /> */}
      <Toaster />
    </Router>
  );
}

export default App;
