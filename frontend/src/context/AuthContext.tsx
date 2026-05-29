import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface User {
  id: number;
  nombre: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restaurar sesión al recargar la página
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsReady(true);
  }, []);

  // Refrescar perfil del usuario periódicamente para detectar cambios de rol en tiempo real
  useEffect(() => {
    if (!token || !user) return;

    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    const refrescarUsuario = async () => {
      try {
        const response = await fetch(`${baseApiUrl}/usuarios/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const freshUser = await response.json();
          // Actualizar el estado si el rol, nombre o email cambiaron
          if (
            freshUser.role !== user.role ||
            freshUser.nombre !== user.nombre ||
            freshUser.email !== user.email
          ) {
            const updatedUser = {
              ...user,
              role: freshUser.role,
              nombre: freshUser.nombre,
              email: freshUser.email
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else if (response.status === 401 || response.status === 403) {
          // Si el token expira o el usuario es desactivado, cerrar sesión
          logout();
        }
      } catch (err) {
        console.error("Error al refrescar perfil del usuario:", err);
      }
    };

    // Polling cada 5 segundos
    const interval = setInterval(refrescarUsuario, 5000);
    return () => clearInterval(interval);
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isReady) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
