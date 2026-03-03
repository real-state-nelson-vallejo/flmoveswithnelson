"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { Loader2, Save, MousePointer2, Plus, Trash2 } from "lucide-react";
import { getTemplateOptionsAction, getMapDetailsAction, saveMapDetailsAction } from "@/app/actions/pdf-mapper";

// Set worker to unpkg CDN for simplicity in Next.js App Router
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FieldMap {
    fieldId: string;
    type: string;
    page: number; // 0-indexed internally, but we might want 1-indexed for UI
    rect: { x: number; y: number; width: number; height: number };
    originalLabel: string;
}
interface FieldMappingToolProps {
    refreshKey?: number;
    onOpenUploader?: () => void;
}

export function FieldMappingTool({ onOpenUploader }: FieldMappingToolProps = {}) {
    const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");

    const [pdfPath, setPdfPath] = useState<string>("");
    const [fields, setFields] = useState<FieldMap[]>([]);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [selectedField, setSelectedField] = useState<FieldMap | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const [zoom, setZoom] = useState(1.5); // PDF scale
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        getTemplateOptionsAction().then(setTemplates).catch(console.error);
    }, []);

    // Load Document Map
    useEffect(() => {
        if (!selectedTemplate) return;
        const load = async () => {
            try {
                const data = await getMapDetailsAction(selectedTemplate);
                setPdfPath(data.pdfPath);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setFields(data.fields.map((f: any) => ({
                    ...f,
                    rect: {
                        x: f.rect?.x || 0,
                        y: f.rect?.y || 0,
                        width: f.rect?.width || 0,
                        height: f.rect?.height || 0
                    }
                })));
                setCurrentPage(1);
                setSelectedField(null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                toast.error("Failed to load map: " + err.message);
            }
        };
        load();
    }, [selectedTemplate]);

    const handleSave = async () => {
        try {
            await saveMapDetailsAction(selectedTemplate, fields);
            toast.success("Map saved successfully!");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast.error("Failed to save: " + err.message);
        }
    };

    const handleAddField = () => {
        const newFieldId = prompt("Enter a unique field ID (e.g., property_address):");
        if (!newFieldId) return;

        const cleanId = newFieldId.trim().toLowerCase().replace(/\s+/g, '_');

        if (fields.some(f => f.fieldId === cleanId)) {
            toast.error("Field ID already exists!");
            return;
        }

        const newField: FieldMap = {
            fieldId: cleanId,
            originalLabel: newFieldId,
            type: 'text',
            page: Math.max(0, currentPage - 1),
            rect: { x: 0, y: 0, width: 0, height: 0 }
        };

        setFields(prev => [newField, ...prev]);
        setSelectedField(newField);
    };

    // --- Drawing Logic ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!selectedField || !containerRef.current) return;
        setIsDrawing(true);

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setStartPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !selectedField || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const curX = (e.clientX - rect.left) / zoom;
        const curY = (e.clientY - rect.top) / zoom;

        // Calculate top-left and width/height
        const newRect = {
            x: Math.min(startPos.x, curX),
            y: Math.min(startPos.y, curY),
            width: Math.abs(curX - startPos.x),
            height: Math.abs(curY - startPos.y)
        };

        setFields(prev => prev.map(f =>
            f.fieldId === selectedField.fieldId
                ? { ...f, rect: newRect, page: currentPage - 1 }
                : f
        ));
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">

            {/* Left Sidebar - Fields List */}
            <div className="w-80 border-r border-border bg-card flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-border space-y-4">
                    <div>
                        <h2 className="text-lg font-bold">PDF Mapper</h2>
                        <p className="text-xs text-muted-foreground">Internal tool to align JSON bounding boxes.</p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="flex-1 min-w-0 h-10 px-3 rounded-lg border bg-background text-sm"
                            value={selectedTemplate}
                            onChange={e => setSelectedTemplate(e.target.value)}
                        >
                            <option value="">Select Document...</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                        <button
                            onClick={onOpenUploader}
                            className="w-10 h-10 flex-none bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                            title="Upload New Template"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!selectedTemplate}
                            className="w-full bg-primary text-primary-foreground h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} /> Save Map
                        </button>
                        <button
                            onClick={handleAddField}
                            disabled={!selectedTemplate}
                            className="w-full border border-border bg-background hover:bg-muted h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={16} /> Add Field
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {fields.length === 0 && selectedTemplate && (
                        <div className="text-center p-4 text-xs text-muted-foreground border border-dashed rounded-lg m-2">
                            No fields found. Click &quot;Add Field&quot; to define fields manually.
                        </div>
                    )}
                    {fields.map(f => {
                        const isMapped = f.rect.width > 0 && f.rect.height > 0;
                        const isSelected = selectedField?.fieldId === f.fieldId;
                        return (
                            <button
                                key={f.fieldId}
                                onClick={() => {
                                    setSelectedField(f);
                                    if (f.page >= 0) setCurrentPage(f.page + 1);
                                }}
                                className={`w-full text-left p-2 rounded-lg text-xs flex flex-col gap-1 transition-colors ${isSelected ? 'bg-primary/10 border border-primary text-primary'
                                    : 'hover:bg-muted border border-transparent'
                                    }`}
                            >
                                <div className="font-mono truncate">{f.fieldId}</div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="truncate max-w-[150px]">{f.originalLabel}</span>
                                    <div className="flex items-center gap-2">
                                        {isMapped ? (
                                            <span className="text-green-500 font-medium pb-[1px] px-1 bg-green-500/10 rounded">Mapped</span>
                                        ) : (
                                            <span className="text-orange-500 font-medium pb-[1px] px-1 bg-orange-500/10 rounded">Unmapped</span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete field ${f.fieldId}?`)) {
                                                    setFields(prev => prev.filter(field => field.fieldId !== f.fieldId));
                                                    if (selectedField?.fieldId === f.fieldId) setSelectedField(null);
                                                }
                                            }}
                                            className="text-red-500/50 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Pane - PDF Viewer */}
            <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">

                {/* PDF Toolbar */}
                <div className="h-12 border-b border-border bg-card flex items-center px-4 justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <MousePointer2 size={16} />
                            {selectedField ? <span className="text-primary font-mono">{selectedField.fieldId}</span> : 'Select a field to draw'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Zoom:</span>
                        <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />

                        <div className="h-6 w-px bg-border mx-2"></div>

                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-2 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50">Prev</button>
                        <span className="text-sm">Page {currentPage} of {numPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="px-2 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50">Next</button>
                    </div>
                </div>

                {/* PDF Canvas Area */}
                <div className="flex-1 overflow-auto p-8 flex items-start justify-center cursor-crosshair relative">
                    {pdfPath ? (
                        <div
                            className="relative shadow-2xl bg-white border border-border"
                            style={{ width: 'fit-content', height: 'fit-content' }}
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <Document
                                file={`/api/pdf-proxy?url=${encodeURIComponent(pdfPath)}`}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                loading={<div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}
                            >
                                <Page
                                    pageNumber={currentPage}
                                    scale={zoom}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>

                            {/* Render Bounding Boxes for CURRENT PAGE */}
                            {fields.filter(f => f.page === currentPage - 1).map(f => {
                                const isSelected = selectedField?.fieldId === f.fieldId;
                                if (f.rect.width === 0) return null; // unmapped

                                return (
                                    <div
                                        key={f.fieldId}
                                        className={`absolute border-2 ${isSelected ? 'border-primary bg-primary/20 z-10' : 'border-blue-500/50 bg-blue-500/10 hover:border-blue-500'}`}
                                        style={{
                                            left: f.rect.x * zoom,
                                            top: f.rect.y * zoom,
                                            width: f.rect.width * zoom,
                                            height: f.rect.height * zoom,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedField(f);
                                        }}
                                    >
                                        <span className="absolute -top-5 left-0 text-[10px] font-mono bg-black text-white px-1 whitespace-nowrap rounded-t opacity-80 pointer-events-none">
                                            {f.fieldId}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a document template to begin mapping
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
