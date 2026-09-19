import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AuthUser } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post<{ token: string; user: AuthUser }>('/auth/register', data),
    onSuccess: ({ data }) => { setAuth(data.token, data.user); navigate('/'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Registrace se nezdařila.'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Registrace</h1>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jméno</label>
            <input {...register('name')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heslo</label>
            <input {...register('password')} type="password" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Registruji...' : 'Zaregistrovat se'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-500">
          Máte účet? <Link to="/login" className="text-brand-600 hover:underline">Přihlásit se</Link>
        </p>
      </div>
    </div>
  );
}
