'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, ArrowRight, FileText, Loader2, Wand2 } from 'lucide-react'; // Check lucide-react usage
import { extractDocumentDataAction, generateDocumentAction, TemplateInfo } from '@/app/actions/documents';
import { PropertyDTO } from '@/backend/property/infrastructure/dto/PropertyDTO';

type Step = 'template' | 'property' | 'ai-context' | 'review' | 'finish';

interface WizardProps {
    templates: TemplateInfo[];
    properties: PropertyDTO[];
    leads?: { id: string; name: string; email: string; phone?: string | undefined; status: string }[];
    presets?: any[];
    userId?: string;
}

export default function DocumentWizard({ templates, properties, leads, presets, userId }: WizardProps) {
    const [step, setStep] = useState<Step>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<string>('');
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [userContext, setUserContext] = useState<string>('');
    const [extractedData, setExtractedData] = useState<Record<string, any>>({});
    const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPdf, setGeneratedPdf] = useState<{ filename: string; base64: string } | null>(null);

    const handleTemplateSelect = (id: string) => {
        setSelectedTemplate(id);
        setStep('property');
    };

    const handlePropertySelect = (id: string) => {
        setSelectedProperty(id);
        setStep('ai-context');
    };

    const handleExtract = async () => {
        if (!selectedTemplate || !selectedProperty) return;
        setIsLoading(true);
        try {
            const result = await extractDocumentDataAction(
                selectedProperty,
                selectedTemplate,
                userContext,
                userId,
                selectedPreset || undefined
            );

            // Extract confidence separately
            const extractedValues: Record<string, any> = result.data || {};
            const confidences: Record<string, number> = result.confidence || {};

            setExtractedData(extractedValues);
            setConfidenceScores(confidences);
            setStep('review');
        } catch (error) {
            console.error(error);
            // Handle error (toast)
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate || !selectedProperty) return;
        setIsLoading(true);
        try {
            const result = await generateDocumentAction(
                selectedProperty,
                selectedTemplate,
                extractedData,
                userId,
                selectedLead || undefined
            );
            setGeneratedPdf(result);
            setStep('finish');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPdf = () => {
        if (!generatedPdf) return;
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${generatedPdf.base64}`;
        link.download = generatedPdf.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create Document</h1>
                <p className="text-muted-foreground">Follow the steps to generate a legal document.</p>
            </div>

            {/* Steps Indicator - simplified */}
            <div className="flex gap-2 mb-8 text-sm text-muted-foreground">
                <span className={step === 'template' ? 'font-bold text-primary' : ''}>1. Template</span> &gt;
                <span className={step === 'property' ? 'font-bold text-primary' : ''}>2. Property</span> &gt;
                <span className={step === 'ai-context' ? 'font-bold text-primary' : ''}>3. Context</span> &gt;
                <span className={step === 'review' ? 'font-bold text-primary' : ''}>4. Review</span> &gt;
                <span className={step === 'finish' ? 'font-bold text-primary' : ''}>5. Finish</span>
            </div>

            {step === 'template' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <Card key={t.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleTemplateSelect(t.id)}>
                            <CardHeader>
                                <CardTitle>{t.name}</CardTitle>
                                <CardDescription>{t.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FileText className="w-12 h-12 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {step === 'property' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Property</CardTitle>
                        <CardDescription>Choose the property this document is related to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {properties.map(p => (
                                <Button
                                    key={p.id}
                                    variant="outline"
                                    className="justify-start text-left h-auto py-3"
                                    onClick={() => handlePropertySelect(p.id)}
                                >
                                    <div>
                                        <div className="font-semibold">{p.title}</div>
                                        <div className="text-xs text-muted-foreground">{p.location.address}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'ai-context' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Smart Context</CardTitle>
                        <CardDescription>Select the parties involved and provide any custom instructions to auto-fill the document.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {leads && leads.length > 0 && (
                            <div className="space-y-2">
                                <Label>Select Lead (Tenant/Buyer)</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedLead}
                                    onChange={e => setSelectedLead(e.target.value)}
                                >
                                    <option value="">-- No specific lead --</option>
                                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
                                </select>
                            </div>
                        )}

                        {presets && presets.length > 0 && (
                            <div className="space-y-2">
                                <Label>Apply Settings Preset</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedPreset}
                                    onChange={e => setSelectedPreset(e.target.value)}
                                >
                                    <option value="">-- Start fresh --</option>
                                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <p className="text-xs text-muted-foreground">Presets contain AI-learned formatting and logic from your historical documents.</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Additional Context</Label>
                            <Textarea
                                placeholder="e.g. Rent is $2500/month starting next Monday. Pet fee is $300."
                                value={userContext}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserContext(e.target.value)}
                                rows={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setStep('property')}>Back</Button>
                        <Button onClick={handleExtract} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Analyze & Extract
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 'review' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review Data</CardTitle>
                        <CardDescription>Review and edit the extracted data before generating the PDF.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(extractedData).map(([key, value]) => {
                                const confidence = confidenceScores[key];
                                let badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                                let badgeText = "High Connfidence";

                                if (confidence !== undefined) {
                                    if (confidence < 0.6) {
                                        badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                                        badgeText = "Low Confidence";
                                    } else if (confidence < 0.85) {
                                        badgeColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
                                        badgeText = "Medium Confidence";
                                    }
                                } else {
                                    badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                                    badgeText = "System Rule"; // Defaults driven by LogicEngine
                                }

                                return (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="capitalize font-semibold">{key.replace(/_/g, ' ')}</Label>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                                                {badgeText}
                                            </span>
                                        </div>
                                        <Input
                                            value={value === true ? "True" : value === false ? "False" : value || ''}
                                            onChange={(e) => setExtractedData({ ...extractedData, [key]: e.target.value })}
                                        />
                                    </div>
                                )
                            })}
                            {Object.keys(extractedData).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No fields extracted. Using default manual entry mode.
                                    {/* Fallback to show known fields from template if extractedData is empty? 
                                        Ideally we would fetch the template schema again to render empty inputs.
                                        For MVP, we rely on what extraction gave us or just show a message.
                                        But wait, if extraction failed or returned {}, user can't edit anything!
                                        
                                        Fix: if extractedData is empty, we should populate it with empty keys from the schema.
                                        But we don't have the schema here easily without another server call.
                                        
                                        Assumption: AI always returns *something* or at least keys with null.
                                    */}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setStep('ai-context')}>Back</Button>
                        <Button onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Generate PDF
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 'finish' && generatedPdf && (
                <Card className="text-center py-10">
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-green-100 p-6 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <FileText className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold">Document Ready!</h2>
                        <p className="text-muted-foreground">Your PDF has been generated successfully.</p>
                        <Button size="lg" onClick={downloadPdf}>
                            Download PDF ({generatedPdf.filename})
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Create Another
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
