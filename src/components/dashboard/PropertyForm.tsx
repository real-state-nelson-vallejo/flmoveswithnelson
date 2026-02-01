"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertySchema } from "@/lib/schemas/propertySchema";
import { createPropertyAction, generateDescriptionAction, CreatePropertyDTO } from "@/actions/property/actions";
import { Loader2, ChevronRight, Wand2, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

// Create a schema specifically for the form that omits system fields
const FormSchema = PropertySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

type FormData = z.infer<typeof FormSchema>;

interface PropertyFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const STEPS = ["Basics", "Location", "Specs", "Images", "Details"];

export function PropertyForm({ onSuccess, onCancel }: PropertyFormProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            title: "",
            price: { amount: 0, currency: "USD" },
            type: "sale",
            status: "available",
            features: [],
            images: [],
            location: { address: "", city: "", country: "United States", state: "", zip: "" },
            specs: { beds: 0, baths: 0, area: 0, areaUnit: "sqft" },
            description: ""
        }
    });

    // Watch values for conditional rendering or AI generation
    const watchedValues = watch();

    const handleGenerateDescription = async () => {
        const { title, location, features, specs, type } = watchedValues;

        if (!title || !location?.city) {
            alert("Please fill in Title and Location first.");
            return;
        }
        setGeneratingAi(true);
        const result = await generateDescriptionAction({
            title: title || "",
            location: `${location.city}, ${location.state}`,
            features: features || [],
            specs: {
                beds: specs?.beds || 0,
                baths: specs?.baths || 0,
                area: specs?.area || 0
            },
            type: type || "sale"
        });

        if (result.success && result.description) {
            setValue("description", result.description, { shouldValidate: true });
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
            const { storage } = await import("@/lib/firebase/client");
            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

            for (const file of files) {
                const path = `properties/uploads/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedUrls.push(url);
            }

            const currentImages = watchedValues.images || [];
            setValue("images", [...currentImages, ...uploadedUrls], { shouldValidate: true });

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        // Cast to DTO but usage of RHF ensures types match closely
        // We might need to map some fields if DTO differs strictly, but FormSchema matches PropertySchema
        // CreatePropertyDTO likely expects similar structure.

        // We need to add back the ID or let action handle it. The action expects CreatePropertyDTO.
        // Let's assume action generates ID if missing or we pass partial.
        const result = await createPropertyAction(data as unknown as CreatePropertyDTO);

        setLoading(false);
        if (result.success) {
            onSuccess();
        } else {
            alert("Error creating property");
        }
    };

    const nextStep = async () => {
        // Validate fields for current step before moving
        let fieldsToValidate: (keyof FormData)[] = [];

        switch (step) {
            case 0: fieldsToValidate = ["title", "type", "status", "price"]; break;
            case 1: fieldsToValidate = ["location"]; break;
            case 2: fieldsToValidate = ["specs"]; break;
            case 3: fieldsToValidate = ["images"]; break;
            case 4: fieldsToValidate = ["description", "features"]; break;
        }

        // Trigger validation for specific fields
        const isStepValid = await trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);

        if (isStepValid) {
            setStep(s => s + 1);
        }
    };

    // --- STEP COMPONENTS ---

    const renderBasics = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Title</label>
                <input
                    {...register("title")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    placeholder="e.g. Modern Villa in Downtown"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select {...register("type")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select {...register("status")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
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
                        {...register("price.amount", { valueAsNumber: true })}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg outline-none"
                        placeholder="0.00"
                    />
                </div>
                {errors.price?.amount && <p className="text-red-500 text-xs mt-1">{errors.price.amount.message}</p>}
            </div>
        </div>
    );

    const renderLocation = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                    {...register("location.address")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    placeholder="Street Address"
                />
                {errors.location?.address && <p className="text-red-500 text-xs mt-1">{errors.location.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input {...register("location.city")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input {...register("location.state")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                    <input {...register("location.zip")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input {...register("location.country")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
            </div>
        </div>
    );

    const renderSpecs = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beds</label>
                    <input type="number" {...register("specs.beds", { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Baths</label>
                    <input type="number" {...register("specs.baths", { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                    <input type="number" {...register("specs.area", { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <select {...register("specs.areaUnit")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
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
            {watchedValues.images && watchedValues.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {watchedValues.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    const newImages = [...(watchedValues.images || [])];
                                    newImages.splice(idx, 1);
                                    setValue("images", newImages);
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
                    {...register("description")}
                    className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg outline-none resize-none"
                    placeholder="Describe the property..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Features (comma separated)</label>
                <Controller
                    name="features"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            placeholder="Pool, Gym, Fireplace..."
                            defaultValue={field.value?.join(", ")}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                            onBlur={(e) => {
                                const feats = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                field.onChange(feats);
                            }}
                        />
                    )}
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
                    onClick={async () => {
                        if (step === STEPS.length - 1) {
                            await handleSubmit(onSubmit)();
                        } else {
                            await nextStep();
                        }
                    }}
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
