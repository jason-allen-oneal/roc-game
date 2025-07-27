'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 max-w-md w-full">
        <div className="w-full">
          {/* Tab Navigation */}
          <div className="flex rounded-lg bg-forest p-1 mb-6 border border-gold">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-gold-gradient text-forest-dark shadow-sm'
                  : 'text-gold-light hover:text-gold'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-gold-gradient text-forest-dark shadow-sm'
                  : 'text-gold-light hover:text-gold'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Container */}
          <div className="bg-earth-gradient rounded-lg shadow-xl p-6 border border-gold">
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </main>
    </div>
  );
} 