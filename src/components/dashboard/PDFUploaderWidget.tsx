"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { UploadCloud, FileType, CheckCircle, Loader2 } from "lucide-react";
import { uploadPDFTemplateAction } from "@/app/actions/upload-pdf-template.action";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function PDFUploaderWidget({ onUploadComplete }: { onUploadComplete?: (templateId: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile) return;

            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                if (!templateName) {
                    setTemplateName(selectedFile.name.replace(".pdf", ""));
                }
            } else {
                toast.error("Only PDF files are supported.");
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !templateName) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("templateName", templateName);

        try {
            const response = await uploadPDFTemplateAction(formData);
            if (response.success && response.templateId) {
                setSuccessMessage("PDF uploaded and fields extracted successfully!");
                toast.success("Template created successfully!");

                // Allow user to view success state briefly
                setTimeout(() => {
                    if (onUploadComplete) onUploadComplete(response.templateId!);
                    // Reset
                    setFile(null);
                    setTemplateName("");
                    setSuccessMessage("");
                }, 2000);
            } else {
                toast.error(response.error || "Upload failed");
            }
        } catch (e: any) {
            toast.error("Request failed: " + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-white font-medium">Upload PDF Template</h3>
                    <p className="text-zinc-400 text-sm">Upload a fillable PDF (AcroForm) to auto-extract fields.</p>
                </div>
            </div>

            <div className="mt-2 space-y-4">
                <div className="relative group">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading}
                    />
                    <div className="border border-dashed border-white/20 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-white/5 group-hover:border-indigo-500/50">
                        {file ? (
                            <div className="flex items-center gap-2 text-indigo-400">
                                <FileType className="w-6 h-6" />
                                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-zinc-400">
                                <UploadCloud className="w-6 h-6 mb-1" />
                                <span className="font-medium">Click or drag PDF here</span>
                                <span className="text-xs text-zinc-500">Max size: 10MB</span>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g., Exclusive Right to Sell"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !templateName}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Extracting Fields...
                                    </>
                                ) : successMessage ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Success!
                                    </>
                                ) : (
                                    "Upload & Parse Template"
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
