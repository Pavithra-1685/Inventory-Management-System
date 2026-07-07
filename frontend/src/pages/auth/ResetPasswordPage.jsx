import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Spinner } from '../../components/ui/Loading';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.put(`/auth/resetpassword/${token}`, { password: data.password }),
    onSuccess: () => {
      toast.success('Password reset successfully!');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Token is invalid or expired');
    },
  });

  const password = watch('password');

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight">Reset Password</h1>
        <p className="text-secondary font-medium mt-2">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="form-group">
          <label className="label">New Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            className={`input ${errors.password ? 'input-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <div className="form-group">
          <label className="label">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: (v) => v === password || 'Passwords do not match'
            })}
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary btn-lg w-full"
        >
          {mutation.isPending ? <Spinner size={18} /> : null}
          {mutation.isPending ? 'Resetting Password...' : 'Reset Password →'}
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-xs font-bold text-secondary hover:text-primary underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
