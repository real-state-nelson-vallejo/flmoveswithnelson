"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";

// Set PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { SlideOver } from "@/components/ui/SlideOver"; // Kept for types if needed, but we'll bypass it
import { Button } from "@/components/ui/Button";
import {
    generateDocumentAction,
    getAvailableTemplates,
    extractDocumentDataAction,
    getTemplateFieldsAction,
    getTransactionPresetsAction,
    createTransactionPresetAction,
    TemplateInfo
} from "@/app/actions/documents";
import { getMapDetailsAction } from "@/app/actions/pdf-mapper";
import { useRouter } from "next/navigation";
import {
    Loader2,
    FileText,
    Building2,
    CheckCircle,
    AlertCircle,
    Wand2,
    ArrowRight,
    ChevronLeft,
    Save,
    Plus
} from "lucide-react";

interface PropertyInfo {
    id: string;
    title: string;
    address: string;
}

interface DocumentCreatorSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    properties: PropertyInfo[];
    leads?: any[];
    presets?: any[];
}

type WizardStep = 'template' | 'property' | 'preset' | 'review' | 'generating';

export function DocumentCreatorSlideOver({ isOpen, onClose, properties, leads = [], presets = [] }: DocumentCreatorSlideOverProps) {
    const router = useRouter();

    // State
    const [step, setStep] = useState<WizardStep>('template');
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    const [selectedLead, setSelectedLead] = useState<string>("");

    // Manual Tenant State
    const [manualTenantName, setManualTenantName] = useState<string>("");
    const [manualTenantEmail, setManualTenantEmail] = useState<string>("");
    const [manualTenantPhone, setManualTenantPhone] = useState<string>("");

    const [userContext, setUserContext] = useState<string>("");

    // Smart Template variable mini-form state
    const [activeSmartTemplate, setActiveSmartTemplate] = useState<{ label: string; emoji: string; text: string } | null>(null);
    const [templateVars, setTemplateVars] = useState<Record<string, string>>({});

    // Save Preset State
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");

    // Data State
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
    const [fields, setFields] = useState<any[]>([]);

    // Live PDF Preview State
    const [pdfDetails, setPdfDetails] = useState<{ pdfPath: string, fields: any[] } | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [previewScale] = useState(1.2);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [mounted, setMounted] = useState(!isOpen); // Wait for open to mount portal

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setMounted(false), 300); // fade out
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Fetch PDF Map when template changes
    useEffect(() => {
        if (!selectedTemplate) {
            setPdfDetails(null);
            return;
        }
        getMapDetailsAction(selectedTemplate).then(setPdfDetails).catch(console.error);
    }, [selectedTemplate]);

    // Extract bracket tokens from a template string → ['monthly_rent', 'start_date', ...]
    const extractBrackets = (text: string): string[] => {
        const matches = text.match(/\[([^\]]+)\]/g) || [];
        const unique = [...new Set(matches.map(m => m.slice(1, -1)))];
        return unique;
    };

    // Replace [token] in text with filled values
    const applyTemplateVars = (text: string, vars: Record<string, string>): string => {
        return text.replace(/\[([^\]]+)\]/g, (_, key) => vars[key] || `[${key}]`);
    };

    // Open mini-form: set active template and initialize vars map
    const openTemplateForm = (tpl: { label: string; emoji: string; text: string }) => {
        const tokens = extractBrackets(tpl.text);
        const initVars: Record<string, string> = {};
        tokens.forEach(t => { initVars[t] = ''; });
        setActiveSmartTemplate(tpl);
        setTemplateVars(initVars);
    };

    // Apply and close mini-form
    const applySmartTemplate = () => {
        if (!activeSmartTemplate) return;
        setUserContext(applyTemplateVars(activeSmartTemplate.text, templateVars));
        setActiveSmartTemplate(null);
        setTemplateVars({});
    };

    useEffect(() => {
        if (isOpen) {
            getAvailableTemplates().then(setTemplates).catch(console.error);
            // Reset state on open
            setStep('template');
            setSelectedTemplate("");
            setSelectedProperty("");
            setSelectedPreset("");
            setSelectedLead("");
            setUserContext("");
            setFormData({});
            setError("");
        }
    }, [isOpen]);

    const handleNextStep = async () => {
        setError("");

        if (step === 'template') {
            if (!selectedTemplate) return;
            setStep('property');
        }
        else if (step === 'property') {
            if (!selectedProperty) return;
            setStep('preset');
        }
        else if (step === 'preset') {
            setIsLoading(true);
            const toastId = toast.loading('🔍 Loading document template fields...', { duration: Infinity });
            try {
                // Step 1: Load template fields
                const [fieldsDef] = await Promise.all([
                    getTemplateFieldsAction(selectedTemplate)
                ]);

                toast.loading(`🤖 Running AI extraction across ${Math.ceil(fieldsDef.length / 20)} batch(es) of fields...`, {
                    id: toastId,
                    duration: Infinity
                });

                // Step 2: AI Extraction (now including manualTenant info if no lead)
                const manualTenantData = selectedLead === "" ? {
                    name: manualTenantName,
                    email: manualTenantEmail,
                    phone: manualTenantPhone
                } : undefined;

                const extractedResult = await extractDocumentDataAction(
                    selectedProperty,
                    selectedTemplate,
                    userContext,
                    "user_1",
                    selectedPreset || undefined,
                    selectedLead || undefined,
                    manualTenantData // Optional manual overrides
                );

                const extractedValues: Record<string, any> = extractedResult.data || {};
                const confidences: Record<string, number> = extractedResult.confidence || {};

                // Calculate confidence summary
                const confValues = Object.values(confidences);
                const highConf = confValues.filter(c => c >= 0.85).length;
                const medConf = confValues.filter(c => c >= 0.6 && c < 0.85).length;
                const lowConf = confValues.filter(c => c < 0.6).length;

                setFields(fieldsDef);
                setFormData(extractedValues);
                setConfidenceScores(confidences);
                setStep('review');

                toast.success(
                    `✅ ${fieldsDef.length} fields extracted — 🟢 ${highConf} high · 🟡 ${medConf} medium · 🔴 ${lowConf} low confidence`,
                    { id: toastId, duration: 5000 }
                );
            } catch (e: any) {
                console.error(e);
                const errMsg = e?.message?.includes('400') ? 'AI schema error — try reducing fields in preset.' : 'Failed to extract data. Please try again.';
                setError(errMsg);
                toast.error(`❌ Extraction failed: ${errMsg}`, { id: toastId, duration: 5000 });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step === 'property') setStep('template');
        if (step === 'preset') setStep('property');
        if (step === 'review') setStep('preset');
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError("");
        const toastId = toast.loading('📄 Generating PDF document...', { duration: Infinity });
        try {
            const result = await generateDocumentAction(selectedProperty, selectedTemplate, formData, "user_1", selectedLead || undefined);

            // Download PDF
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${result.base64}`;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('✅ Document generated and downloaded!', { id: toastId, duration: 4000 });
            router.refresh();

            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (e: any) {
            console.error(e);
            setError("Failed to generate final PDF.");
            toast.error('❌ Failed to generate PDF. Please try again.', { id: toastId, duration: 5000 });
            setIsLoading(false);
        }
    };



    const handleSavePreset = async () => {
        if (!newPresetName.trim()) return;
        setIsLoading(true);
        try {
            await createTransactionPresetAction("user_1", newPresetName, formData, "Saved from document creator"); // TODO: real userId
            setIsSavingPreset(false);
            setNewPresetName("");
            // Refresh presets if we were on that step, though we are on review now.
        } catch (e) {
            console.error(e);
            setError("Failed to save preset.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const updateBoolField = (key: string, value: boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    if (!mounted && !isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-50 flex transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${step === 'review' ? 'bg-background items-stretch justify-start' : 'bg-background/80 backdrop-blur-sm items-center justify-center p-4'}
        `}>

            {/* Embedded Toaster for this specific flow, positioning depends on state */}
            <div className={`absolute z-[60] pointer-events-none w-[350px]
                ${step === 'review' ? 'left-[450px] bottom-0' : 'bottom-4 right-4'}
            `}>
                <Toaster position="bottom-right" className="pointer-events-auto" />
            </div>

            {/* Left Pane - Wizard Form */}
            <div className={`bg-card border-border shadow-soft-xl flex flex-col relative z-20 transition-all duration-500 overflow-hidden
                ${step === 'review' ? 'w-full sm:w-[450px] sm:min-w-[450px] shrink-0 h-full border-r' : 'w-full max-w-[450px] h-[600px] max-h-[90vh] rounded-2xl border'}
            `}>

                {/* Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background shrink-0">
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        {step === 'template' ? 'Legal Docs' :
                            step === 'property' ? 'Select Property' :
                                step === 'preset' ? 'Build Context' : 'Review & Finalize'}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors">
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-muted shrink-0 w-full">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                            width: step === 'template' ? '25%' :
                                step === 'property' ? '50%' :
                                    step === 'preset' ? '75%' : '100%'
                        }}
                    />
                </div>

                <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden w-full relative">

                    {/* Step 1: Template Selection */}
                    {step === 'template' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold text-foreground">Select Document Type</h3>
                            <div className="grid gap-3">
                                {templates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`
                                        cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3
                                        ${selectedTemplate === t.id
                                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                                : 'bg-card border-border hover:border-primary/50 hover:bg-muted/30'}
                                    `}
                                    >
                                        <div className={`mt-0.5 p-2 rounded-lg ${selectedTemplate === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{t.name}</div>
                                            <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
                                        </div>
                                        {selectedTemplate === t.id && (
                                            <CheckCircle className="ml-auto text-primary" size={20} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Property Selection */}
                    {step === 'property' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold text-foreground">Select Property</h3>
                            <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2">
                                {properties.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedProperty(p.id)}
                                        className={`
                                        cursor-pointer p-3 rounded-xl border transition-all flex items-center gap-3
                                        ${selectedProperty === p.id
                                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                                : 'bg-card border-border hover:border-primary/50 hover:bg-muted/30'}
                                    `}
                                    >
                                        <div className={`p-2 rounded-lg ${selectedProperty === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                            <Building2 size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground truncate">{p.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                                        </div>
                                        {selectedProperty === p.id && (
                                            <CheckCircle className="ml-auto text-primary flex-shrink-0" size={18} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preset Selection */}
                    {step === 'preset' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Smart Context</h3>
                                <p className="text-sm text-muted-foreground">Select the parties involved and provide any custom instructions to auto-fill the document.</p>
                            </div>

                            {leads && leads.length > 0 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Select CRM Lead (Tenant/Buyer)</label>
                                        <select
                                            className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                                            value={selectedLead}
                                            onChange={e => setSelectedLead(e.target.value)}
                                        >
                                            <option value="">-- No specific lead (Enter manually) --</option>
                                            {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
                                        </select>
                                    </div>

                                    {/* Manual Tenant Entry (only visible if no lead is selected) */}
                                    {selectedLead === "" && (
                                        <div className="p-4 rounded-xl border border-border bg-card/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-sm text-muted-foreground">Or provide tenant details manually to help AI fill the document accurately:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-foreground">Tenant Name(s)</label>
                                                    <input
                                                        type="text"
                                                        value={manualTenantName}
                                                        onChange={e => setManualTenantName(e.target.value)}
                                                        placeholder="John Doe & Jane Smith"
                                                        className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm transition-all text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-foreground">Email</label>
                                                    <input
                                                        type="email"
                                                        value={manualTenantEmail}
                                                        onChange={e => setManualTenantEmail(e.target.value)}
                                                        placeholder="john@example.com"
                                                        className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm transition-all text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-1 sm:col-span-2">
                                                    <label className="text-xs font-medium text-foreground">Phone Number</label>
                                                    <input
                                                        type="text"
                                                        value={manualTenantPhone}
                                                        onChange={e => setManualTenantPhone(e.target.value)}
                                                        placeholder="(555) 123-4567"
                                                        className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm transition-all text-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Smart Prompt Templates */}
                            {selectedTemplate && (() => {
                                const currentLead = leads.find((l: any) => l.id === selectedLead);
                                const currentProperty = properties.find(p => p.id === selectedProperty);
                                const leadName = currentLead?.name || '[Lead Name]';
                                const propertyTitle = currentProperty?.title || '[Property]';
                                const propertyAddress = currentProperty?.address || '[Address]';

                                const SMART_TEMPLATES: Record<string, { label: string; emoji: string; text: string }[]> = {
                                    'erl-14': [
                                        {
                                            label: 'Standard Listing (No Pets)',
                                            emoji: '🏠',
                                            text: `I want to list ${propertyTitle} at ${propertyAddress} for $[monthly_rent] per month starting [start_date]. My broker commission will be [commission]% of the full annual lease or $[flat_fee] flat, whichever is greater. The listing agreement starts on [start_date] and expires in [duration] months. No pets allowed of any size. Credit checks must be paid by the prospective tenants themselves. The owner/landlord is [landlord_name].`
                                        },
                                        {
                                            label: 'Flexible Listing w/ Pets',
                                            emoji: '🐕',
                                            text: `List ${propertyTitle} at ${propertyAddress} for $[monthly_rent]/month starting [start_date]. Broker commission: [commission]% of annual lease. Listing period ends [end_date]. Allow pets under [pet_weight_lbs] lbs with a non-refundable pet fee of $[pet_fee]. Owner authorizes broker to use their name in marketing. Lockbox access permitted. The owner/landlord is [landlord_name].`
                                        }
                                    ],
                                    'rlhd-3x-v1': [
                                        {
                                            label: 'Standard Residential Lease',
                                            emoji: '📋',
                                            text: `The primary tenant is ${leadName}. Monthly rent is $[monthly_rent], due on the [due_day]th of each month with a $[late_fee] late fee after [grace_days] days. Security deposit: $[security_deposit]. First and last month required at signing. No pets allowed. Landlord pays for landscaping. Tenant is responsible for electricity, internet, and trash. Lease: [lease_months] months starting [start_date]. The landlord/owner is [landlord_name].`
                                        },
                                        {
                                            label: 'Pet-Friendly Lease',
                                            emoji: '🐾',
                                            text: `The primary tenant is ${leadName}. Rent: $[monthly_rent]/month, due on the [due_day]th, $[late_fee] late fee after [grace_days] days. Security deposit: $[security_deposit] plus first and last month upfront. Allow [pet_count] pet(s) under [pet_weight_lbs] lbs, non-refundable pet fee: $[pet_fee]. Landlord covers landscaping and pest control. Tenant pays electricity, water, internet, and trash. Lease: [lease_months] months from [start_date]. The landlord/owner is [landlord_name].`
                                        }
                                    ]
                                };

                                const templatesForType = SMART_TEMPLATES[selectedTemplate];
                                if (!templatesForType || templatesForType.length === 0) return null;

                                return (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Wand2 size={14} className="text-primary" />
                                            Smart Prompt Templates
                                        </label>

                                        {/* Active template mini-form */}
                                        {activeSmartTemplate ? (
                                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{activeSmartTemplate.emoji}</span>
                                                        <span className="text-sm font-semibold text-foreground">{activeSmartTemplate.label}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSmartTemplate(null)}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >✕ Cancel</button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Fill in the required values. Unfilled ones will stay as <code className="text-amber-500">[placeholders]</code> in the text.</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {Object.keys(templateVars).map(token => (
                                                        <div key={token} className="space-y-1">
                                                            <label className="text-xs font-medium text-primary/80 uppercase tracking-wide">
                                                                {token.replace(/_/g, ' ')}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={templateVars[token]}
                                                                onChange={e => setTemplateVars(prev => ({ ...prev, [token]: e.target.value }))}
                                                                placeholder={`e.g. ${token === 'monthly_rent' ? '2500' : token === 'start_date' ? '03/15/2026' : token === 'commission' ? '10' : '...'}`}
                                                                className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm transition-all"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={applySmartTemplate}
                                                    className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Wand2 size={14} /> Apply Template
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs text-muted-foreground">Click a template, fill in the variables, and it will auto-populate your instructions.</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {templatesForType.map((tpl, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => openTemplateForm(tpl)}
                                                            className="text-left p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-lg">{tpl.emoji}</span>
                                                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{tpl.label}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{tpl.text.slice(0, 100)}...</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Custom Instructions</label>
                                <textarea
                                    placeholder="e.g. Rent is $2500/month starting next Monday. Pet fee is $300."
                                    value={userContext}
                                    onChange={(e) => setUserContext(e.target.value)}
                                    rows={6}
                                    className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none resize-none text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    💡 Tip: The more specific you are, the higher the AI confidence will be. Include dollar amounts, dates, names, and conditions.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Apply Settings Preset</label>
                                <p className="text-xs text-muted-foreground mb-2">Choose an AI-learned configuration to pre-fill standard terms faster.</p>

                                <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {/* Option: No Preset */}
                                    <div
                                        onClick={() => setSelectedPreset("")}
                                        className={`
                                        cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3
                                        ${selectedPreset === ""
                                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                                : 'bg-card border-border hover:border-primary/50 hover:bg-muted/30'}
                                    `}
                                    >
                                        <div className={`p-2 rounded-lg ${selectedPreset === "" ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground text-sm">No Preset (Standard)</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Use AI extraction only (no standard defaults).</div>
                                        </div>
                                        {selectedPreset === "" && (
                                            <CheckCircle className="ml-auto text-primary" size={20} />
                                        )}
                                    </div>

                                    {/* Loaded Presets */}
                                    {presets.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPreset(p.id)}
                                            className={`
                                        cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3
                                        ${selectedPreset === p.id
                                                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                                                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/30'}
                                    `}
                                        >
                                            <div className={`p-2 rounded-lg ${selectedPreset === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                                <Wand2 size={18} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground">{p.name}</div>
                                                <div className="text-sm text-muted-foreground mt-1">{p.description || "Custom configuration"}</div>
                                            </div>
                                            {selectedPreset === p.id && (
                                                <CheckCircle className="ml-auto text-primary" size={20} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review & Edit */}
                    {step === 'review' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 overflow-y-auto px-1">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                                <Wand2 className="text-primary shrink-0 mt-1" size={18} />
                                <div>
                                    <h4 className="font-medium text-foreground">AI Auto-Fill Complete</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        We&apos;ve extracted data from the property/deal to fill this legal document. Please review and edit below.
                                    </p>
                                </div>
                            </div>

                            {/* Save as Preset UI */}
                            {!isSavingPreset ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSavingPreset(true)}
                                    className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Save current values as Smart Preset
                                </Button>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Preset Name</label>
                                        <input
                                            autoFocus
                                            value={newPresetName}
                                            onChange={(e) => setNewPresetName(e.target.value)}
                                            placeholder="e.g. Standard Lease - No Pets"
                                            className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsSavingPreset(false)}
                                            className="h-8"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSavePreset}
                                            disabled={!newPresetName.trim() || isLoading}
                                            className="h-8"
                                        >
                                            <Save className="mr-2 h-3 w-3" /> Save Preset
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-6">
                                {/* Grouping Logic: Landlord, Tenant, Property, Lease/Financials */}
                                {['Landlord', 'Tenant', 'Property', 'Lease', 'Other'].map(group => {
                                    const groupFields = fields.filter(f => {
                                        const id = f.fieldId.toLowerCase();
                                        if (group === 'Landlord') return id.includes('landlord') || id.includes('owner');
                                        if (group === 'Tenant') return id.includes('tenant') || id.includes('buyer');
                                        if (group === 'Property') return id.includes('property') || id.includes('address');
                                        if (group === 'Lease') return id.includes('lease') || id.includes('rent') || id.includes('date') || id.includes('term');
                                        // Fallback for 'Other'
                                        const isCaptured = id.includes('landlord') || id.includes('owner') || id.includes('tenant') || id.includes('buyer') ||
                                            id.includes('property') || id.includes('address') || id.includes('lease') || id.includes('rent') ||
                                            id.includes('date') || id.includes('term');
                                        return !isCaptured;
                                    });

                                    if (groupFields.length === 0) return null;

                                    return (
                                        <div key={group} className="space-y-3">
                                            <h4 className="font-semibold text-foreground/80 border-b border-border/50 pb-1">{group === 'Other' ? 'Additional Details' : `${group} Details`}</h4>
                                            <div className="grid gap-3">
                                                {groupFields.map(field => {
                                                    const confidence = confidenceScores[field.fieldId];
                                                    let badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200/50";
                                                    let badgeText = "High Confidence";

                                                    if (confidence !== undefined) {
                                                        if (confidence < 0.6) {
                                                            badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/50";
                                                            badgeText = "Low Confidence";
                                                        } else if (confidence < 0.85) {
                                                            badgeColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200/50";
                                                            badgeText = "Medium Confidence";
                                                        }
                                                    } else {
                                                        badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50";
                                                        badgeText = "System Rule";
                                                    }

                                                    const isCheckbox = field.type === 'checkbox';
                                                    const boolValue = formData[field.fieldId] === true || formData[field.fieldId] === 'true';

                                                    return (
                                                        <div key={field.fieldId} className={`space-y-1.5 w-full min-w-0 overflow-hidden ${isCheckbox
                                                            ? 'flex items-center justify-between gap-3 bg-background/50 border border-border rounded-lg px-3 py-2.5'
                                                            : ''
                                                            }`}>
                                                            {isCheckbox ? (
                                                                // Checkbox field: rendered as a toggle row
                                                                <>
                                                                    <div className="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
                                                                        <label
                                                                            className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate w-full"
                                                                            title={field.fieldId.replace(/_/g, ' ')}
                                                                        >
                                                                            {field.fieldId.replace(/_/g, ' ')}
                                                                        </label>
                                                                        <span className={`text-[9px] px-1.5 py-0 rounded font-medium border w-fit shrink-0 whitespace-nowrap ${badgeColor}`}>
                                                                            {badgeText}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        role="switch"
                                                                        aria-checked={boolValue}
                                                                        onClick={() => updateBoolField(field.fieldId, !boolValue)}
                                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 
                                                                        ${boolValue
                                                                                ? 'bg-primary border-primary'
                                                                                : 'bg-muted border-border'
                                                                            }`}
                                                                    >
                                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200
                                                                        ${boolValue ? 'translate-x-5' : 'translate-x-0'}`}
                                                                        />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                // Text/Date/Money field: regular input
                                                                <>
                                                                    <div className="flex items-center justify-between gap-2 pr-1 w-full min-w-0 overflow-hidden">
                                                                        <label
                                                                            className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate flex-1 min-w-0"
                                                                            title={field.fieldId.replace(/_/g, ' ')}
                                                                        >
                                                                            {field.fieldId.replace(/_/g, ' ')}
                                                                        </label>
                                                                        <span className={`text-[9px] px-1.5 py-0 rounded font-medium border shrink-0 whitespace-nowrap ${badgeColor}`}>
                                                                            {badgeText}
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={formData[field.fieldId] === null || formData[field.fieldId] === undefined ? '' : String(formData[field.fieldId])}
                                                                        onChange={(e) => updateField(field.fieldId, e.target.value)}
                                                                        className="w-full h-10 px-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 text-sm"
                                                                        placeholder={`Enter ${field.fieldId.replace(/_/g, ' ')}...`}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div> {/* <--- Closes p-6 scrollable area */}

                {/* Footer / Actions */}
                <div className="mt-auto p-4 border-t border-border flex justify-between items-center gap-3 bg-background shrink-0">
                    {step !== 'template' ? (
                        <Button variant="ghost" onClick={handleBack} disabled={isLoading} className="rounded-xl">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                    )}

                    {error && <span className="text-xs text-red-500 truncate max-w-[150px]">{error}</span>}

                    {step !== 'review' ? (
                        <Button
                            onClick={handleNextStep}
                            disabled={
                                (step === 'template' && !selectedTemplate) ||
                                (step === 'property' && !selectedProperty) ||
                                isLoading
                            }
                            className="rounded-xl"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="rounded-xl min-w-[140px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                </>
                            ) : (
                                "Generate PDF"
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Pane - Live PDF Preview (Only visible in Review step) */}
            {step === 'review' && (
                <div className="flex-1 hidden sm:flex bg-muted/30 relative flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-16 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
                        <h3 className="text-sm font-medium text-foreground">Live Document Preview</h3>
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md border border-border">
                            {pdfDetails ? `${pdfDetails.fields.length} Configured Fields` : 'Waiting for selection...'}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-8 flex justify-center pb-[200px]">
                        {pdfDetails && pdfDetails.pdfPath ? (
                            <div className="relative shadow-2xl bg-white border border-border h-fit">
                                <Document
                                    file={`/api/pdf-proxy?url=${encodeURIComponent(pdfDetails.pdfPath)}`}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    loading={<div className="p-20"><Loader2 className="animate-spin text-primary" /></div>}
                                >
                                    {Array.from(new Array(numPages), (_, index) => (
                                        <div key={`page_${index + 1}`} className="relative mb-4 last:mb-0 border-b border-border/10 last:border-0 shadow-sm">
                                            <Page
                                                pageNumber={index + 1}
                                                scale={previewScale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className="pointer-events-none"
                                            />
                                            {/* Render Live Fields for this Page */}
                                            {pdfDetails.fields.filter(f => f.page === index).map(f => {
                                                // Handle empty/unmapped fields gracefully
                                                const val = formData[f.fieldId];
                                                const hasValue = val !== undefined && val !== null && val !== "";
                                                const isMapped = f.rect.width > 0 && f.rect.height > 0;

                                                if (!isMapped) return null; // Don't show if it hasn't been mapped at all

                                                const isCheckbox = f.type === 'checkbox';

                                                return (
                                                    <div
                                                        key={f.fieldId}
                                                        className={`absolute font-sans text-blue-800 font-medium whitespace-nowrap overflow-hidden z-10 pointer-events-none rounded-sm border ${hasValue ? 'bg-blue-100/30 border-blue-400/20 px-1' : 'bg-red-500/10 border-red-500/30'}`}
                                                        style={{
                                                            left: f.rect.x * previewScale,
                                                            top: f.rect.y * previewScale,
                                                            width: f.rect.width * previewScale,
                                                            height: f.rect.height * previewScale, // Important for checkboxes and empty fields
                                                            fontSize: `${(f.style?.fontSize || 10) * previewScale}px`,
                                                            maxWidth: f.rect.width * previewScale,
                                                            lineHeight: 1.2
                                                        }}
                                                        title={f.originalLabel}
                                                    >
                                                        {hasValue ? (isCheckbox ? (val === true || val === 'true' ? 'X' : '') : String(val)) : ''}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </Document>
                            </div>
                        ) : (
                            <div className="text-muted-foreground h-full flex flex-col items-center justify-center pt-20">
                                <FileText size={48} className="opacity-20 mb-4" />
                                <p>Select a template to preview</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
