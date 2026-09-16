import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [token,   setToken]   = useState(null);
  const [ready,   setReady]   = useState(false); // true after rehydration from localStorage

  // Rehydrate on first load
  useEffect(() => {
    try {
      const savedToken   = localStorage.getItem('sg_token');
      const savedStudent = localStorage.getItem('sg_student');
      if (savedToken && savedStudent) {
        setToken(savedToken);
        setStudent(JSON.parse(savedStudent));
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem('sg_token');
      localStorage.removeItem('sg_student');
    }
    setReady(true);
  }, []);

  const login = (studentData, jwtToken) => {
    setStudent(studentData);
    setToken(jwtToken);
    localStorage.setItem('sg_token',   jwtToken);
    localStorage.setItem('sg_student', JSON.stringify(studentData));
  };

  const logout = () => {
    setStudent(null);
    setToken(null);
    localStorage.removeItem('sg_token');
    localStorage.removeItem('sg_student');
  };

  // Keep localStorage in sync if student data is updated elsewhere
  const updateStudent = (updated) => {
    setStudent(updated);
    localStorage.setItem('sg_student', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ student, token, ready, login, logout, updateStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
