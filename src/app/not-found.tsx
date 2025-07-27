import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-forest-gradient flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-earth-gradient p-8 rounded-lg border border-gold shadow-xl">
        <h2 className="text-2xl font-bold text-gold-light mb-4 drop-shadow-lg">
          Page Not Found
        </h2>
        <p className="text-gold-light mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-gold-gradient text-forest-dark rounded hover:opacity-90 transition-all duration-200 font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  );
} 