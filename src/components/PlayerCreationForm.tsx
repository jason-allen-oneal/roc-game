'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';

const AVATAR_OPTIONS = [
  { id: 'male1', url: '/avatars/male/1.webp', gender: 'male' },
  { id: 'male2', url: '/avatars/male/2.webp', gender: 'male' },
  { id: 'male3', url: '/avatars/male/3.webp', gender: 'male' },
  { id: 'male4', url: '/avatars/male/4.webp', gender: 'male' },
  { id: 'male5', url: '/avatars/male/5.webp', gender: 'male' },
  { id: 'male6', url: '/avatars/male/6.webp', gender: 'male' },
  { id: 'male7', url: '/avatars/male/7.webp', gender: 'male' },
  { id: 'male8', url: '/avatars/male/8.webp', gender: 'male' },
  { id: 'female1', url: '/avatars/female/1.webp', gender: 'female' },
  { id: 'female2', url: '/avatars/female/2.webp', gender: 'female' },
  { id: 'female3', url: '/avatars/female/3.webp', gender: 'female' },
  { id: 'female4', url: '/avatars/female/4.webp', gender: 'female' },
  { id: 'female5', url: '/avatars/female/5.webp', gender: 'female' },
  { id: 'female6', url: '/avatars/female/6.webp', gender: 'female' },
  { id: 'female7', url: '/avatars/female/7.webp', gender: 'female' },
  { id: 'female8', url: '/avatars/female/8.webp', gender: 'female' },
];

export default function PlayerCreationForm() {
  const router = useRouter();
  const { refreshPlayer } = usePlayer();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const avatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
      if (!avatar) {
        throw new Error('Please select an avatar');
      }

      const response = await fetch('/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          gender: avatar.gender,
          avatar: avatar.url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create player');
      }

      // Refresh the player context to get the new player data
      await refreshPlayer();

      // Redirect to the game
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Character</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Character Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-4 gap-4">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`p-2 rounded-lg border-2 ${
                  selectedAvatar === avatar.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Image
                  src={avatar.url}
                  alt={`${avatar.gender} avatar`}
                  width={64}
                  height={64}
                  className="w-full h-auto"
                />
                <p className="text-center mt-2 text-sm capitalize">{avatar.gender}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
} 