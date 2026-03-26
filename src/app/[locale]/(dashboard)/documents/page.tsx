import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Plus, FileText, Download, User, Trash2 } from "lucide-react";
import { FirestoreLegalDocumentRepository } from "@/backend/legal-docs/infrastructure/FirestoreLegalDocumentRepository";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import { FirestoreLeadRepository } from "@/backend/lead/infrastructure/FirestoreLeadRepository";
import { deleteDocumentAction } from "@/app/actions/documents";

export default async function DocumentsPage() {
    const repo = new FirestoreLegalDocumentRepository();
    const propertyRepo = new FirestorePropertyRepository();
    const leadRepo = new FirestoreLeadRepository();

    // Fetch all documents
    const documents = await repo.findAll();

    // Fetch related entities (in a real app, use a join query or parallel fetch)
    const enrichedDocs = await Promise.all(
        documents.map(async (doc) => {
            const property = await propertyRepo.findById(doc.propertyId).catch(() => null);
            const lead = doc.leadId ? await leadRepo.findById(doc.leadId).catch(() => null) : null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = doc.toPersistence() as any;
            return {
                ...p,
                propertyTitle: property?.UnparsedAddress || doc.propertyId,
                leadName: lead?.name || "Unknown Lead"
            };
        })
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Legal Documents</h1>
                    <p className="text-muted-foreground">Generate and manage your legal contracts.</p>
                </div>
                <Link href="/documents/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichedDocs.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No documents yet</h3>
                            <p className="text-muted-foreground mb-4">Get started by creating your first legal document.</p>
                            <Link href="/documents/new">
                                <Button variant="outline">Create Document</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    enrichedDocs.map((doc) => (
                        <Card key={doc.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="truncate">{doc.type}</span>
                                    {doc.status === 'draft' && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">Draft</span>}
                                    {doc.status === 'generated' && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground hover:bg-blue-600/80 bg-blue-600">Generated</span>}
                                    {doc.status === 'signed' && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground hover:bg-green-600/80 bg-green-600">Signed</span>}
                                </CardTitle>
                                <CardDescription>
                                    Created on {new Date(doc.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Property:</span>
                                        <span className="font-medium text-foreground truncate max-w-[150px]" title={doc.propertyTitle}>
                                            {doc.propertyTitle}
                                        </span>
                                    </div>
                                    {doc.leadId && (
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Tenant/Buyer:</span>
                                            <span className="font-medium text-foreground truncate max-w-[150px] flex items-center gap-1" title={doc.leadName}>
                                                <User className="w-3 h-3" /> {doc.leadName}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                        <form action={deleteDocumentAction.bind(null, doc.id)}>
                                            <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                        <div className="flex gap-2">
                                            {doc.generatedPdfUrl ? (
                                                <a href={doc.generatedPdfUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm">
                                                        <Download className="mr-2 h-4 w-4" /> Download
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Button variant="ghost" size="sm" disabled>
                                                    <Download className="mr-2 h-4 w-4" /> No PDF
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
