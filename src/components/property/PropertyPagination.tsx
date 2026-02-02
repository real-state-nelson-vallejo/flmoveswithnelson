import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PropertyDTO } from "@/types/property";

interface PropertyPaginationProps {
    locale: string;
    prev?: PropertyDTO | null;
    next?: PropertyDTO | null;
}

export function PropertyPagination({ locale, prev, next }: PropertyPaginationProps) {
    return (
        <div className="flex justify-between items-center py-8 mt-8 border-t border-b border-slate-100">
            {prev ? (
                <Link
                    href={`/${locale}/properties/${prev.slug || prev.id}`}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs text-slate-400 font-normal">Previous</span>
                        <span className="max-w-[150px] truncate">{prev.title}</span>
                    </div>
                </Link>
            ) : (
                <div className="flex items-center gap-2 text-slate-300 select-none cursor-not-allowed">
                    <ArrowLeft size={18} />
                    <span className="font-medium">Previous Property</span>
                </div>
            )}

            <span className="text-slate-300 hidden md:block">|</span>

            {next ? (
                <Link
                    href={`/${locale}/properties/${next.slug || next.id}`}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group text-right"
                >
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 font-normal">Next</span>
                        <span className="max-w-[150px] truncate">{next.title}</span>
                    </div>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            ) : (
                <div className="flex items-center gap-2 text-slate-300 select-none cursor-not-allowed">
                    <span className="font-medium">Next Property</span>
                    <ArrowRight size={18} />
                </div>
            )}
        </div>
    );
}
