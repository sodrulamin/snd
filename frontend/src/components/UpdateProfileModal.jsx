import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Phone, MapPin, X, CheckCircle2, AlertCircle, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UpdateProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name && user.name !== 'System Administrator' ? user.name : (user.fullName && user.fullName !== 'System Administrator' ? user.fullName : (user.username || '')),
        mobile: user.mobile || user.phone || '',
        email: user.email || '',
        address: user.address || '',
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
      {/* Fullscreen Backdrop Overlay */}
      <div
        className="fixed -inset-10 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-3xl w-full max-w-lg p-6 shadow-2xl my-auto z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Update Profile</h3>
              <p className="text-xs text-slate-400">
                Personal details for <strong className="text-teal-300 font-mono">@{user?.username}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Account Info Pill */}
        <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-400">Account Role</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            user?.role === 'ADMIN' 
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {user?.role || 'USER'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                required
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mobile Phone
            </label>
            <div className="relative">
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+880 1XXXXXXXXX"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@domain.com"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Address
            </label>
            <div className="relative">
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full street address, city"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none"
              />
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
