import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 px-4 text-center py-20">
            <h1 className="text-9xl font-extrabold text-slate-200">404</h1>
            <h2 className="text-2xl font-bold text-slate-900 mt-4">Page Not Found</h2>
            <p className="text-slate-500 mt-2 max-w-md">
                The property or page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Home
            </Link>
        </div>
    );
}
