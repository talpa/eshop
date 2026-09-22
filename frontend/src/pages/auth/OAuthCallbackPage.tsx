import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AuthUser } from '../../types';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        toast.error('Přihlášení selhalo.');
        navigate('/login');
        return;
      }
      try {
        const { data } = await api.get<AuthUser>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(token, data);
        toast.success('Přihlášení proběhlo úspěšně.');
        navigate('/');
      } catch {
        toast.error('Přihlášení selhalo.');
        navigate('/login');
      }
    };
    run();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Přihlašuji...</p>
    </div>
  );
}
