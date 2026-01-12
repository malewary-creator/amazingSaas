import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getFirebaseClient } from '@/services/firebase';
import { firebaseAuthService } from '@/services/firebaseAuthService';

function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@shinesolar.com');
  const [password, setPassword] = useState('admin123');
  const firebaseEnabled = Boolean(getFirebaseClient());
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (email === 'admin@shinesolar.com' && password === 'admin123') {
      // Temporary login - will be replaced with actual authentication
      const demoUser = {
        id: 1,
        email: 'admin@shinesolar.com',
        mobile: '9999999999',
        name: 'Admin User',
        role: 1,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      login(demoUser);
      toast.success('Login successful!');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } else {
      toast.error('Invalid email or password');
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    try {
      const result = await firebaseAuthService.signInWithGooglePopup();

      // App currently uses a local/demo user model.
      // For Firebase-authenticated sessions we store the Firebase ID token in `authStore.token`
      // and map to an app User shape (role mapping should be replaced with real RBAC later).
      const firebaseUser = {
        id: 1,
        email: result.email || 'firebase-user',
        mobile: '',
        name: result.displayName || result.email || 'Firebase User',
        role: 1,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      login(firebaseUser, result.idToken);
      toast.success('Firebase login successful!');
      setTimeout(() => navigate('/dashboard'), 100);
    } catch (error: any) {
      toast.error(error?.message || 'Firebase login failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">☀️ Shine Solar</h1>
          <p className="text-gray-600">Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email / Mobile
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin@shinesolar.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Login
          </button>

          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={!firebaseEnabled}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={firebaseEnabled ? 'Sign in using Firebase Google Auth' : 'Set VITE_FIREBASE_* in .env.local to enable'}
          >
            Continue with Google (Firebase)
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default Login: admin@shinesolar.com / admin123</p>
          {!firebaseEnabled && (
            <p className="mt-2 text-xs text-gray-500">
              Firebase login is disabled (missing VITE_FIREBASE_* env vars).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
