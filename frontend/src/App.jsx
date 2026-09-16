import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home              from './pages/Home';
import Register          from './pages/Register';
import Login             from './pages/Login';
import StudentDashboard  from './pages/StudentDashboard';
import UploadProjects    from './pages/UploadProjects';
import SkillDNA          from './pages/SkillDNA';
import CompanyVerify     from './pages/CompanyVerify';
import CompanyDashboard  from './pages/CompanyDashboard';
import BlockchainExplorer from './pages/BlockchainExplorer';
import Leaderboard       from './pages/Leaderboard';
import PublicProfile     from './pages/PublicProfile';
import NotFound          from './pages/NotFound';

// Teacher pages
import TeacherRegister   from './pages/teacher/TeacherRegister';
import TeacherLogin      from './pages/teacher/TeacherLogin';
import TeacherDashboard  from './pages/teacher/TeacherDashboard';
import QuizEditor        from './pages/teacher/QuizEditor';
import QuizResults       from './pages/teacher/QuizResults';

// Student quiz pages
import QuizList          from './pages/quiz/QuizList';
import TakeQuiz          from './pages/quiz/TakeQuiz';
import QuizResult        from './pages/quiz/QuizResult';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar/>
      <main className="main-content">
        <Routes>
          {/* ── Public ── */}
          <Route path="/"            element={<Home/>}/>
          <Route path="/register"    element={<Register/>}/>
          <Route path="/login"       element={<Login/>}/>
          <Route path="/verify"      element={<CompanyVerify/>}/>
          <Route path="/companies"   element={<CompanyDashboard/>}/>
          <Route path="/leaderboard" element={<Leaderboard/>}/>
          <Route path="/profile/:id" element={<PublicProfile/>}/>
          <Route path="/explorer"    element={<BlockchainExplorer/>}/>

          {/* ── Student protected ── */}
          <Route path="/dashboard/:id" element={<ProtectedRoute><StudentDashboard/></ProtectedRoute>}/>
          <Route path="/upload/:id"    element={<ProtectedRoute><UploadProjects/></ProtectedRoute>}/>
          <Route path="/skill-dna/:id" element={<ProtectedRoute><SkillDNA/></ProtectedRoute>}/>

          {/* ── Student quiz ── */}
          <Route path="/quizzes"          element={<ProtectedRoute><QuizList/></ProtectedRoute>}/>
          <Route path="/quiz/take/:quizId" element={<ProtectedRoute><TakeQuiz/></ProtectedRoute>}/>
          <Route path="/quiz/result/:quizId" element={<ProtectedRoute><QuizResult/></ProtectedRoute>}/>

          {/* ── Teacher auth (public) ── */}
          <Route path="/teacher/register"  element={<TeacherRegister/>}/>
          <Route path="/teacher/login"     element={<TeacherLogin/>}/>

          {/* ── Teacher protected ── */}
          <Route path="/teacher/dashboard"           element={<TeacherDashboard/>}/>
          <Route path="/teacher/quiz/:quizId"        element={<QuizEditor/>}/>
          <Route path="/teacher/quiz/:quizId/results" element={<QuizResults/>}/>

          <Route path="/404" element={<NotFound/>}/>
          <Route path="*"    element={<Navigate to="/404" replace/>}/>
        </Routes>
      </main>
    </div>
  );
}
