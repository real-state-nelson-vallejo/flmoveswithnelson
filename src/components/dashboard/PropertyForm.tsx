"use client";

import { useState } from "react";
import { CreatePropertyDTO } from "@/actions/property/actions";
import { createPropertyAction, generateDescriptionAction } from "@/actions/property/actions";
import { Loader2, ChevronRight, Wand2, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

interface PropertyFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const STEPS = ["Basics", "Location", "Specs", "Images", "Details"];

export function PropertyForm({ onSuccess, onCancel }: PropertyFormProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);

    // Initial State
    const [formData, setFormData] = useState<Partial<CreatePropertyDTO>>({
        title: "",
        price: { amount: 0, currency: "USD" },
        type: "sale",
        status: "available",
        features: [],
        images: [],
        location: { address: "", city: "", country: "United States", state: "", zip: "" },
        specs: { beds: 0, baths: 0, area: 0, areaUnit: "sqft" },
        description: ""
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNestedChange = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(prev as any)[parent],
                [field]: value
            }
        }));
    };

    const handleGenerateDescription = async () => {
        if (!formData.title || !formData.location?.city) {
            alert("Please fill in Title and Location first.");
            return;
        }
        setGeneratingAi(true);
        const result = await generateDescriptionAction({
            title: formData.title || "",
            location: `${formData.location.city}, ${formData.location.state}`,
            features: formData.features || [],
            specs: {
                beds: formData.specs?.beds || 0,
                baths: formData.specs?.baths || 0,
                area: formData.specs?.area || 0
            },
            type: formData.type || "sale"
        });

        if (result.success && result.description) {
            handleChange("description", result.description);
        } else {
            alert("Failed to generate description.");
        }
        setGeneratingAi(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setLoading(true);
        const files = Array.from(e.target.files);
        const uploadedUrls: string[] = [];

        try {
            // Lazy import storage to avoid issues if not initialized yet, or use exported 'storage' from client
            const { storage } = await import("@/lib/firebase/client");
            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

            for (const file of files) {
                // Determine path: properties / uploads / {timestamp}_{filename}
                const path = `properties/uploads/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedUrls.push(url);
            }

            handleChange("images", [...(formData.images || []), ...uploadedUrls]);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        // Basic validation could go here

        // Cast to DTO (handling strict types in real app)
        const result = await createPropertyAction(formData as CreatePropertyDTO);

        setLoading(false);
        if (result.success) {
            onSuccess();
        } else {
            alert("Error creating property");
        }
    };

    // --- STEP COMPONENTS ---

    const renderBasics = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    placeholder="e.g. Modern Villa in Downtown"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    >
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange("status", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input
                        type="number"
                        value={formData.price?.amount || ""}
                        onChange={(e) => handleNestedChange("price", "amount", Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg outline-none"
                        placeholder="0.00"
                    />
                </div>
            </div>
        </div>
    );

    const renderLocation = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                    type="text"
                    value={formData.location?.address}
                    onChange={(e) => handleNestedChange("location", "address", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    placeholder="Street Address"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                        type="text"
                        value={formData.location?.city}
                        onChange={(e) => handleNestedChange("location", "city", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                        type="text"
                        value={formData.location?.state}
                        onChange={(e) => handleNestedChange("location", "state", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                    <input
                        type="text"
                        value={formData.location?.zip}
                        onChange={(e) => handleNestedChange("location", "zip", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input
                        type="text"
                        value={formData.location?.country || "United States"}
                        onChange={(e) => handleNestedChange("location", "country", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
            </div>
        </div>
    );

    const renderSpecs = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beds</label>
                    <input
                        type="number"
                        value={formData.specs?.beds}
                        onChange={(e) => handleNestedChange("specs", "beds", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Baths</label>
                    <input
                        type="number"
                        value={formData.specs?.baths}
                        onChange={(e) => handleNestedChange("specs", "baths", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                    <input
                        type="number"
                        value={formData.specs?.area}
                        onChange={(e) => handleNestedChange("specs", "area", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <select
                        value={formData.specs?.areaUnit}
                        onChange={(e) => handleNestedChange("specs", "areaUnit", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    >
                        <option value="sqft">sqft</option>
                        <option value="m2">m²</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderImages = () => (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                />
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <p className="font-medium text-slate-900">Click to upload images</p>
                    <p className="text-xs">PNG, JPG up to 10MB</p>
                </div>
            </div>

            {/* Image Preview List */}
            {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => {
                                    const newImages = [...(formData.images || [])];
                                    newImages.splice(idx, 1);
                                    handleChange("images", newImages);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderDetails = () => (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingAi}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
                    >
                        {generatingAi ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {generatingAi ? "Generating..." : "AI Generate"}
                    </button>
                </div>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg outline-none resize-none"
                    placeholder="Describe the property..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Features (comma separated)</label>
                <input
                    type="text"
                    placeholder="Pool, Gym, Fireplace..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    onBlur={(e) => {
                        const feats = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleChange("features", feats);
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-8 px-2">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= i ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                            }`}>
                            {i + 1}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${step >= i ? "text-slate-900" : "text-slate-400"
                            }`}>{s}</span>
                    </div>
                ))}
                {/* Progress Line */}
                <div className="absolute left-6 right-6 top-7 h-[2px] bg-slate-100 -z-0" />
                <div
                    className="absolute left-6 h-[2px] bg-slate-900 -z-0 transition-all duration-300"
                    style={{ width: `${(step / (STEPS.length - 1)) * 85}%` }}
                />
            </div>

            {/* Form Content */}
            <div className="flex-1">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === 0 && renderBasics()}
                    {step === 1 && renderLocation()}
                    {step === 2 && renderSpecs()}
                    {step === 3 && renderImages()}
                    {step === 4 && renderDetails()}
                </motion.div>
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                <button
                    onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
                    disabled={loading}
                >
                    {step === 0 ? "Cancel" : "Back"}
                </button>

                <button
                    onClick={() => step === STEPS.length - 1 ? handleSubmit() : setStep(s => s + 1)}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                    ) : step === STEPS.length - 1 ? (
                        "Create Property"
                    ) : (
                        <>
                            Next <ChevronRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
