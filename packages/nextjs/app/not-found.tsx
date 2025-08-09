import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center bg-gray-800/50 backdrop-blur-sm p-12 rounded-2xl border border-purple-500/20 shadow-2xl">
        <h1 className="text-8xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-3xl font-semibold mb-4 text-white">Page Not Found</h2>
        <p className="text-gray-400 mb-8 text-lg">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-8 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
