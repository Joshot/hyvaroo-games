'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage("REGISTRATION SUCCESSFUL. INITIALIZING...");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md pixel-panel p-8">
        <h2 className="text-2xl font-pixel text-retro-warning mb-6 text-center drop-shadow-md">NEW ADVENTURER</h2>
        
        {error && <div className="mb-4 p-3 bg-red-900/50 text-retro-accent border-2 border-retro-accent font-pixel text-xs">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-900/50 text-retro-success border-2 border-retro-success font-pixel text-xs">{message}</div>}
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block font-pixel text-xs mb-2 text-gray-300">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-black border-2 border-gray-600 focus:border-retro-warning text-white font-vt323 text-xl outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs mb-2 text-gray-300">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-black border-2 border-gray-600 focus:border-retro-warning text-white font-vt323 text-xl outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="pixel-btn w-full text-retro-warning border-retro-warning hover:bg-retro-warning hover:text-black mt-4 disabled:opacity-50"
          >
            {loading ? 'REGISTERING...' : 'REGISTER ACCOUNT'}
          </button>
        </form>
        
        <div className="mt-8 text-center font-pixel text-xs text-gray-500">
          ALREADY REGISTERED? <Link href="/login" className="text-retro-info hover:text-white transition-colors">LOGIN</Link>
        </div>
      </div>
    </div>
  );
}
