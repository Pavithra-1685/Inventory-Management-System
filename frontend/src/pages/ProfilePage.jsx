import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/Loading';
import { RefreshCw, User, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: pErrors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const { register: regPass, handleSubmit: handlePass, formState: { errors: passErrors }, watch: watchPass, reset: resetPass } = useForm();
  const newPass = watchPass('newPassword');

  const profileMutation = useMutation({
    mutationFn: (d) => api.put('/auth/updateprofile', d),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success('Profile updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const passMutation = useMutation({
    mutationFn: (d) => api.put('/auth/updatepassword', d),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPass();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account settings and password.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b-3 border-primary">
        {[{ id: 'profile', label: 'Profile Info', icon: User }, { id: 'password', label: 'Change Password', icon: Lock }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-wide border-b-3 -mb-[3px] transition-colors ${activeTab === tab.id ? 'border-primary bg-primary text-white' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-accent">
            <div className="w-16 h-16 bg-primary border-3 border-primary text-white flex items-center justify-center font-black text-2xl">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black">{user?.name}</h2>
              <p className="text-secondary text-sm font-medium capitalize">{user?.role} · {user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfile((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input type="text" {...regProfile('name', { required: 'Name is required' })} className="input" />
              {pErrors.name && <p className="form-error">{pErrors.name.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" value={user?.email} className="input bg-accent/30 cursor-not-allowed" disabled readOnly />
              <p className="text-xs text-secondary mt-1">Email cannot be changed. Contact admin if required.</p>
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input type="text" {...regProfile('phone')} className="input" placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <input type="text" value={user?.role} className="input bg-accent/30 cursor-not-allowed capitalize" disabled readOnly />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={profileMutation.isPending} className="btn-primary btn-sm">
                {profileMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <form onSubmit={handlePass((d) => passMutation.mutate(d))} className="space-y-4">
            <div className="form-group">
              <label className="label">Current Password *</label>
              <input type="password" {...regPass('currentPassword', { required: 'Current password is required' })} className="input" placeholder="Enter your current password" />
              {passErrors.currentPassword && <p className="form-error">{passErrors.currentPassword.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">New Password *</label>
              <input type="password" {...regPass('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })} className="input" placeholder="Minimum 6 characters" />
              {passErrors.newPassword && <p className="form-error">{passErrors.newPassword.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">Confirm New Password *</label>
              <input type="password" {...regPass('confirmPassword', { required: 'Please confirm new password', validate: (v) => v === newPass || 'Passwords do not match' })} className="input" placeholder="Repeat new password" />
              {passErrors.confirmPassword && <p className="form-error">{passErrors.confirmPassword.message}</p>}
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={passMutation.isPending} className="btn-primary btn-sm">
                {passMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
