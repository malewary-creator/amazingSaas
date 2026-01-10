import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@shinesolar.com');
  const [password, setPassword] = useState('admin123');
  
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
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default Login: admin@shinesolar.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
