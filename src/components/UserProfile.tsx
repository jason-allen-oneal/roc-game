'use client';

import { useUser } from '@/contexts/UserContext';

export default function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) {
    return <div className="text-gray-500">Loading user...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-gray-500">No user data</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">User Profile</h3>
      <div className="space-y-2">
        <p><span className="font-medium">Email:</span> {user.email}</p>
        {user.name && <p><span className="font-medium">Name:</span> {user.name}</p>}
        {user.lastPlayedKingdom && (
          <p><span className="font-medium">Last Kingdom:</span> {user.lastPlayedKingdom}</p>
        )}
      </div>
    </div>
  );
} 