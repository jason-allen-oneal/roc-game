'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Game error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-forest-gradient flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-earth-gradient p-8 rounded-lg border border-gold shadow-xl">
        <h2 className="text-2xl font-bold text-gold-light mb-4 drop-shadow-lg">
          Game Error
        </h2>
        <p className="text-gold-light mb-6">
          {error.message || 'Something went wrong while loading the game'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gold-gradient text-forest-dark rounded hover:opacity-90 transition-all duration-200 font-medium"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-forest text-gold-light rounded hover:bg-forest-light transition-all duration-200 font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
} 