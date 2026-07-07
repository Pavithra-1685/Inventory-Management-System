import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Spinner } from '../../components/ui/Loading';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/forgotpassword', data),
    onSuccess: () => {
      toast.success('Reset email sent if the account exists');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight">Forgot Password</h1>
        <p className="text-secondary font-medium mt-2">Enter your email and we'll send you a password reset link.</p>
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

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary btn-lg w-full"
        >
          {mutation.isPending ? <Spinner size={18} /> : null}
          {mutation.isPending ? 'Sending Link...' : 'Send Reset Link →'}
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
