import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-9xl font-bold text-[#D4AF37] mb-4 opacity-20">404</h1>
            <h2 className="text-4xl font-bold text-white mb-6">Page Not Found</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                className="bg-[#D4AF37] text-black font-bold px-8 py-4 rounded-full hover:bg-white transition-all transform hover:scale-105"
            >
                Return Home
            </Link>
        </div>
    )
}
