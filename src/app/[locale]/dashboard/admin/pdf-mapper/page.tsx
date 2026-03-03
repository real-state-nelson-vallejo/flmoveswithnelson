"use client";

import { useState } from "react";
import { FieldMappingTool } from "@/components/admin/FieldMappingTool";
import { PDFUploaderWidget } from "@/components/dashboard/PDFUploaderWidget";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function AdminPdfMapperPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);

    return (
        <div className="p-4 flex flex-col gap-4 h-[calc(100vh-64px)]">
            <div className="flex-1 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-h-0">
                <FieldMappingTool key={refreshKey} onOpenUploader={() => setIsUploaderOpen(true)} />
            </div>

            <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
                <DialogContent className="sm:max-w-[600px] border-border bg-card p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Upload PDF Template</DialogTitle>
                    <div className="bg-card">
                        <PDFUploaderWidget onUploadComplete={() => {
                            setRefreshKey(prev => prev + 1);
                            setIsUploaderOpen(false);
                        }} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
