import { createContext, useContext, useState, useCallback } from 'react';
import { getStudent } from '../api/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading]               = useState(false);

  const loadStudent = useCallback(async (studentId) => {
    try {
      setLoading(true);
      const { data } = await getStudent(studentId);
      if (data.success) setCurrentStudent(data.student);
    } catch {
      setCurrentStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStudent = () => setCurrentStudent(null);

  return (
    <AppContext.Provider value={{ currentStudent, setCurrentStudent, loadStudent, clearStudent, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
