'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/game/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 border-2 border-gray-900 bg-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Adventurer Login</h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 focus:border-gray-900 outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 focus:border-gray-900 outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Enter the Expanse'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          Don't have an account? <Link href="/register" className="font-bold underline hover:text-gray-600">Register here</Link>
        </div>
      </div>
    </div>
  );
}
