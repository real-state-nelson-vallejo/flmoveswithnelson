"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PropertyPagination({ locale }: { locale: string }) {
    return (
        <div className="flex justify-between items-center py-8 mt-8 border-t border-b border-slate-100">
            <Link
                href={`/${locale}/properties/previous-slug`}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
                <ArrowLeft size={18} />
                <span>Previous Property</span>
            </Link>

            <span className="text-slate-300">|</span>

            <Link
                href={`/${locale}/properties/next-slug`}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
                <span>Next Property</span>
                <ArrowRight size={18} />
            </Link>
        </div>
    );
}
