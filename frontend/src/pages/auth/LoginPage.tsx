import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api, getAuthBaseUrl } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AuthUser } from '../../types';

const schema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(1, 'Zadejte heslo'),
});
type FormData = z.infer<typeof schema>;

function OAuthButton({ provider, label, icon }: { provider: string; label: string; icon: React.ReactNode }) {
  const base = getAuthBaseUrl();
  const href = `${base}/auth/${provider}`;
  return (
    <a
      href={href}
      className="w-full flex items-center justify-center gap-2.5 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg py-2 text-sm font-medium text-slate-700 transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'oauth_config') toast.error('OAuth přihlášení není nakonfigurováno.');
    else if (error) toast.error('Přihlášení přes OAuth selhalo.');
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post<{ token: string; user: AuthUser }>('/auth/login', data),
    onSuccess: ({ data }) => { setAuth(data.token, data.user); navigate(from, { replace: true }); },
    onError: (err: any) => toast.error(err.response?.data?.message || t('auth.login.error')),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold mb-6">{t('auth.login.title')}</h1>

        <div className="space-y-2 mb-5">
          <OAuthButton provider="google" label="Pokračovat přes Google" icon={
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          } />
          <OAuthButton provider="facebook" label="Pokračovat přes Facebook" icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.023 10.125 11.927V15.563H7.078v-3.49h3.047V9.413c0-3.02 1.792-4.688 4.533-4.688 1.313 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.93-1.956 1.883v2.277h3.328l-.532 3.49h-2.796v8.437C19.612 23.096 24 18.1 24 12.073z"/></svg>
          } />
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">nebo emailem</span></div>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.login.email')}</label>
            <input {...register('email')} type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.login.password')}</label>
            <input {...register('password')} type="password" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {mutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-500">
          {t('auth.login.noAccount')} <Link to="/register" className="text-brand-600 hover:underline">{t('auth.login.register')}</Link>
        </p>
      </div>
    </div>
  );
}
