import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AuthUser } from '../../types';

const schema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(1, 'Zadejte heslo'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post<{ token: string; user: AuthUser }>('/auth/login', data),
    onSuccess: ({ data }) => { setAuth(data.token, data.user); navigate('/'); },
    onError: () => toast.error(t('auth.login.error')),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold mb-6">{t('auth.login.title')}</h1>
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
