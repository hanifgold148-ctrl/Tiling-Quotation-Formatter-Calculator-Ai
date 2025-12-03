
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { HanifgoldLogoIcon } from './icons';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        // SIGNUP LOGIC
        if (!formData.name || !formData.email || !formData.password) {
             throw new Error('All fields are required.');
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });
        
        if (error) throw error;

        // Check if session is missing, which implies email verification is required
        if (data.user && !data.session) {
            setMessage("Registration successful! Please check your email to verify your account.");
            // We stay on the signup view or switch to login view to show the message clearly
        } else {
            setMessage("Account created! Logging you in...");
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0a0f1c] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151e32] rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700">
        
        {/* Header Section */}
        <div className="bg-brand-dark dark:bg-[#0f172a] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(234,179,8,0.3)_0%,transparent_60%)]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl mb-4 shadow-lg border border-white/10">
               <HanifgoldLogoIcon className="w-16 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 font-display">Hanifgold AI</h1>
            <p className="text-sm text-gray-400">Professional Tiling Quotations</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <div className="flex justify-center mb-8 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow text-brand-dark dark:text-white' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow text-brand-dark dark:text-white' : 'text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all dark:text-white"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg text-center font-medium animate-pulse">
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-lg text-center font-medium border border-green-200 dark:border-green-800 shadow-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-gold to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms of Service.
              <br />
              &copy; {new Date().getFullYear()} Hanifgold Tiling Experts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
