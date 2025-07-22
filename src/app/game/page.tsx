import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../api/auth/[...nextauth]/route';
import GameScreen from '@/components/GameScreen';

const prisma = new PrismaClient();

export default async function GamePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user has a player
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { player: true }
  });

  if (!user?.player) {
    redirect('/create-player');
  }

  return <GameScreen player={user.player} />;
} 