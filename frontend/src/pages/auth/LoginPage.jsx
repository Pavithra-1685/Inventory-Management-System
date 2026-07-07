import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store';
import { Spinner } from '../../components/ui/Loading';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      setTimeout(() => navigate('/'), 0);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight">Sign In</h1>
        <p className="text-secondary font-medium mt-2">Enter your credentials to access the platform.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="form-group">
          <label className="label">Email Address</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="admin@inventory.com"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-bold text-secondary hover:text-primary underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary btn-lg w-full"
        >
          {mutation.isPending ? <Spinner size={18} /> : null}
          {mutation.isPending ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-8 border-3 border-accent p-4 bg-accent/20">
        <p className="text-xs font-black uppercase tracking-widest mb-3">Demo Credentials</p>
        <div className="space-y-1.5 font-mono text-xs">
          {[
            { role: 'Admin', email: 'admin@inventory.com', pass: 'Admin@123' },
            { role: 'Manager', email: 'manager@inventory.com', pass: 'Manager@123' },
            { role: 'Staff', email: 'staff@inventory.com', pass: 'Staff@123' },
          ].map(({ role, email, pass }) => (
            <div key={role} className="flex items-center gap-2">
              <span className="badge badge-default text-[10px]">{role}</span>
              <span className="text-secondary">{email} / {pass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
