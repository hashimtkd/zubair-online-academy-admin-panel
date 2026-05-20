import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, BookOpen, Key, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const { login, resetPassword, error, isDemo } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter both email and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast('Welcome back! Signed in successfully.', 'success');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to sign in. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast('Please enter your email address.', 'warning');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      toast(`Password reset link sent to ${resetEmail}. Check your inbox!`, 'success');
      setIsForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to send password reset email.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Pre-fill credentials helper for demo mode
  const handleQuickFill = (role: 'super' | 'admin') => {
    if (role === 'super') {
      setEmail('superadmin@zubair.com');
      setPassword('password123');
    } else {
      setEmail('admin@zubair.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* Branding Column (Islamic Art Theme Graphic) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-slate-100 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500 via-emerald-800 to-slate-950 scale-150 animate-pulse pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
            Z
          </div>
          <span className="font-extrabold text-base tracking-widest uppercase text-slate-50">Zubair Online Academy</span>
        </div>
        
        <div className="relative z-10 my-auto max-w-lg">
          <BookOpen className="w-16 h-16 text-green-500 mb-6" />
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Academy Control & Learning Operations Hub
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Manage course catalog, verify student credentials, approve teacher registrations, and organize backups.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-green-600" />
          <span>Secured with Firebase Authentication & SSL encryption.</span>
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          
          {/* Mobile Logo display */}
          <div className="flex flex-col lg:hidden items-center text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-2xl shadow-lg mb-2">
              Z
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
              Zubair Academy
            </h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Management Portal
            </p>
          </div>

          {!isForgotPassword ? (
            /* SIGN IN FORM */
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-center lg:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  Sign In
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Enter your credentials to access the admin panel
                </p>
              </div>

              {error && (
                <div className="flex gap-3 p-4 rounded-xl border border-red-200/50 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs leading-relaxed font-medium">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@zubairacademy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
                
                <div>
                  <div className="flex justify-between mb-1">
                    {/* label is handled inside Input, placeholder here is for spacing */}
                  </div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline cursor-pointer focus:outline-none"
                      >
                        Forgot?
                      </button>
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-3"
                  isLoading={isLoading}
                >
                  Sign In to Dashboard
                </Button>
              </form>
            </div>
          ) : (
            /* FORGOT PASSWORD FORM */
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-center lg:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Enter your email to receive a password reset instructions
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@zubairacademy.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full py-3"
                    isLoading={isResetting}
                  >
                    Send Reset Link
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm font-semibold text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer text-center"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Login Helper Panel for Demo mode */}
          {isDemo && (
            <div className="border border-green-200/50 dark:border-green-950/40 bg-green-50/20 dark:bg-green-950/5 rounded-2xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>Demo Sandbox Logins</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                You are in Demo mode (no Firebase configuration detected). Use these credentials for instant access:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('super')}
                  className="flex-1 flex items-center justify-between text-left p-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Super Admin</span>
                    <span className="text-[10px] text-slate-400 truncate">superadmin@zubair.com</span>
                  </div>
                  <Key className="w-3.5 h-3.5 text-green-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="flex-1 flex items-center justify-between text-left p-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Standard Admin</span>
                    <span className="text-[10px] text-slate-400 truncate">admin@zubair.com</span>
                  </div>
                  <Key className="w-3.5 h-3.5 text-green-600" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default Login;
