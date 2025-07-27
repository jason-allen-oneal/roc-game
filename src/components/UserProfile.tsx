'use client';

import { useUser } from '@/contexts/UserContext';

export default function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) {
    return <div className="text-gold-light">Loading user...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-gold-light">No user data</div>;
  }

  return (
    <div className="bg-earth-gradient p-4 rounded-lg shadow-lg border border-gold">
      <h3 className="text-lg font-semibold mb-2 text-gold-light">User Profile</h3>
      <div className="space-y-2 text-gold-light">
        <p><span className="font-medium text-gold">Email:</span> {user.email}</p>
        {user.name && <p><span className="font-medium text-gold">Name:</span> {user.name}</p>}
        {user.lastPlayedKingdom && (
          <p><span className="font-medium text-gold">Last Kingdom:</span> {user.lastPlayedKingdom}</p>
        )}
      </div>
    </div>
  );
} 