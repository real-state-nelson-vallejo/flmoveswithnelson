"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    FileText,
    Download,
    Search,
    LayoutGrid,
    List as ListIcon,
    MoreVertical,
    Filter,
    FileSignature,
    Calendar,
    Building2,
    Clock,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteDocumentAction } from "@/app/actions/documents";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface LegalDocument {
    id: string;
    type: string;
    propertyId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    generatedPdfUrl?: string;
}

interface DocumentsDashboardProps {
    initialDocuments: LegalDocument[];
}

import { DocumentCreatorSlideOver } from "@/components/dashboard/DocumentCreatorSlideOver";

export function DocumentsDashboard({
    initialDocuments,
    properties = [],
    leads = [],
    presets = []
}: DocumentsDashboardProps & { properties?: any[], leads?: any[], presets?: any[] }) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    // Delete Confirmation State
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter documents
    const filteredDocuments = initialDocuments.filter(doc => {
        const typeMatch = (doc.type || "").toLowerCase().includes(searchQuery.toLowerCase());
        const propertyMatch = (doc.propertyId || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = typeMatch || propertyMatch;

        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 w-full">
            <DocumentCreatorSlideOver
                isOpen={isCreatorOpen}
                onClose={() => setIsCreatorOpen(false)}
                properties={properties}
                leads={leads}
                presets={presets}
            />

            {/* Header Section with Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/0 to-secondary/10 border border-white/20 p-8 shadow-sm backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Legal Documents
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg font-light">
                            Generate, manage, and track your property contracts.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/pdf-mapper">
                            <Button
                                variant="outline"
                                className="rounded-xl h-12 px-4 md:px-6 backdrop-blur-md bg-background/50 border-white/20 hover:bg-background/80 transition-all"
                            >
                                <FileSignature className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden sm:inline">PDF Mapper Tools</span>
                            </Button>
                        </Link>
                        <Button
                            onClick={() => setIsCreatorOpen(true)}
                            className="rounded-xl h-12 px-4 md:px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                        >
                            <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Create Document
                        </Button>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by type or property..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none backdrop-blur-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-xl p-1 backdrop-blur-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>

                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 pl-4 pr-10 rounded-xl bg-background/50 border border-border/50 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer hover:bg-background/80 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-dashed border-border/50 bg-card/30">
                        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                            <FileText className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">No documents found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            {searchQuery ? "Try adjusting your search filters." : "Get started by creating your first legal document."}
                        </p>
                        {!searchQuery && (
                            <Button variant="outline" onClick={() => setIsCreatorOpen(true)} className="mt-6 rounded-xl">Create Document</Button>
                        )}
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {viewMode === 'grid' ? (
                            <motion.div
                                key="grid-view"
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {filteredDocuments.map((doc, i) => (
                                    <motion.div
                                        key={doc.id || `doc-grid-${i}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative bg-card/50 hover:bg-card border border-border/50 hover:border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-secondary text-secondary-foreground'}`}>
                                                <FileSignature size={24} />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    doc.status === 'draft' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-lg text-foreground mb-1 truncate" title={doc.type}>
                                            {doc.type}
                                        </h3>

                                        <div className="space-y-3 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 p-2 rounded-lg">
                                                <Building2 size={14} className="shrink-0" />
                                                <span className="truncate">{doc.propertyId}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                                <Calendar size={12} />
                                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                <span className="mx-1">•</span>
                                                <Clock size={12} />
                                                <span>{new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                                <MoreVertical size={16} className="text-muted-foreground" />
                                            </button>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mr-auto h-8 text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => setDocumentToDelete(doc.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs rounded-lg hover:bg-secondary"
                                                onClick={() => window.open(doc.generatedPdfUrl, '_blank')}
                                                disabled={!doc.generatedPdfUrl}
                                            >
                                                Preview
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs rounded-lg border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = doc.generatedPdfUrl!;
                                                    link.target = "_blank";
                                                    link.download = `${doc.type}-${doc.id}.pdf`;
                                                    link.click();
                                                }}
                                                disabled={!doc.generatedPdfUrl}
                                            >
                                                <Download className="mr-1.5 h-3 w-3" /> Download
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list-view"
                                layout
                                className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm"
                            >
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Document Type</th>
                                            <th className="px-6 py-4 text-left">Property</th>
                                            <th className="px-6 py-4 text-left">Status</th>
                                            <th className="px-6 py-4 text-left">Created Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredDocuments.map((doc, i) => (
                                            <motion.tr
                                                key={doc.id || `doc-list-${i}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-secondary text-secondary-foreground'}`}>
                                                            <FileSignature size={16} />
                                                        </div>
                                                        <span className="font-medium text-foreground">{doc.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                                                    {doc.propertyId}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                                        doc.status === 'draft' ? 'bg-amber-500/10 text-amber-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                                                        onClick={() => setDocumentToDelete(doc.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-secondary"
                                                        onClick={() => window.open(doc.generatedPdfUrl, '_blank')}
                                                        disabled={!doc.generatedPdfUrl}
                                                    >
                                                        <FileText size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-secondary text-primary"
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = doc.generatedPdfUrl!;
                                                            link.target = "_blank";
                                                            link.download = `${doc.type}-${doc.id}.pdf`;
                                                            link.click();
                                                        }}
                                                        disabled={!doc.generatedPdfUrl}
                                                    >
                                                        <Download size={14} />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Legal Document</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone and will permanently remove it from your records.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDocumentToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={isDeleting}
                            onClick={async () => {
                                if (documentToDelete) {
                                    setIsDeleting(true);
                                    try {
                                        await deleteDocumentAction(documentToDelete);
                                        setDocumentToDelete(null);
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }
                            }}
                        >
                            {isDeleting ? "Deleting..." : "Delete Document"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
