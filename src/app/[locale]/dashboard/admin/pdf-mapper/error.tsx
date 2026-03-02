"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function PdfMapperError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("PDF Mapper Error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-red-500/10 border border-red-500/20 rounded-xl m-6">
            <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong!</h2>
            <p className="text-red-400 mb-6 font-mono text-sm">{error.message}</p>
            <Button onClick={() => reset()} variant="outline" className="border-red-500/50 hover:bg-red-500/20 text-red-400">
                Try again
            </Button>
        </div>
    );
}
