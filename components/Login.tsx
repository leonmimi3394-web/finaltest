
import React, { useState } from 'react';
import { Lightbulb, User, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('adbfc_users_db') || '[]');

        if (isLogin) {
          // LOGIN LOGIC
          const user = users.find((u: any) => u.email === email && u.password === password);
          
          if (user) {
            onLogin({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: null
            });
          } else {
            setError('Invalid email or password');
            setLoading(false);
          }
        } else {
          // SIGN UP LOGIC
          if (!name.trim()) {
            setError('Name is required');
            setLoading(false);
            return;
          }

          if (users.some((u: any) => u.email === email)) {
            setError('Account already exists with this email');
            setLoading(false);
            return;
          }

          const newUser = {
            uid: 'local-user-' + Date.now(),
            email,
            password, // In a real app, hash this!
            displayName: name,
            createdAt: new Date().toISOString()
          };

          localStorage.setItem('adbfc_users_db', JSON.stringify([...users, newUser]));
          
          onLogin({
            uid: newUser.uid,
            displayName: newUser.displayName,
            email: newUser.email,
            photoURL: null
          });
        }
      } catch (err) {
        setError('An unexpected error occurred');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
           <div className="bg-indigo-600 p-3 rounded-xl shadow-lg transform rotate-3">
             <Lightbulb size={40} className="text-white" />
           </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to adbfc' : 'Create Account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Offline LED Business Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name or Shop Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 border"
                    placeholder="e.g. Rahim Electric"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 border"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md p-3 border"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? "New here?" : "Already joined?"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
               <button
                 type="button"
                 onClick={() => {
                   setIsLogin(!isLogin);
                   setError('');
                   setEmail('');
                   setPassword('');
                   setName('');
                 }}
                 className="text-indigo-600 hover:text-indigo-500 font-medium text-sm transition"
               >
                 {isLogin ? "Create an account" : "Sign in to existing account"}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
