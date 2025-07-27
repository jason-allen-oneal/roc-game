import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    redirect('/game');
  }

  return (
    <div className="min-h-screen bg-forest-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gold-light drop-shadow-lg">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-earth-gradient py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gold">
          <LoginForm />
        </div>
      </div>
    </div>
  );
} 