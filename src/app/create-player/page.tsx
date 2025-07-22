import PlayerCreationForm from '@/components/PlayerCreationForm';

export default function CreatePlayerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Your Kingdom
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Create your character to begin your journey
          </p>
        </div>
        <PlayerCreationForm />
      </div>
    </div>
  );
} 