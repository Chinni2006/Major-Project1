import { createContext, useContext, useState, useEffect } from 'react';

const TeacherAuthContext = createContext(null);

export function TeacherAuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('sg_teacher');
      const tok = localStorage.getItem('sg_teacher_token');
      if (t && tok) setTeacher(JSON.parse(t));
    } catch { localStorage.removeItem('sg_teacher'); localStorage.removeItem('sg_teacher_token'); }
    setReady(true);
  }, []);

  const loginTeacher = (data, token) => {
    setTeacher(data);
    localStorage.setItem('sg_teacher',       JSON.stringify(data));
    localStorage.setItem('sg_teacher_token', token);
    // Also set as the active bearer token
    localStorage.setItem('sg_token', token);
  };

  const logoutTeacher = () => {
    setTeacher(null);
    localStorage.removeItem('sg_teacher');
    localStorage.removeItem('sg_teacher_token');
    localStorage.removeItem('sg_token');
  };

  return (
    <TeacherAuthContext.Provider value={{ teacher, ready, loginTeacher, logoutTeacher }}>
      {children}
    </TeacherAuthContext.Provider>
  );
}

export const useTeacherAuth = () => useContext(TeacherAuthContext);
