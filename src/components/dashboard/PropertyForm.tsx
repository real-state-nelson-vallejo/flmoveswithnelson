"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertySchema } from "@/lib/schemas/propertySchema";
import { createPropertyAction, updatePropertyAction, generateDescriptionAction, analyzePropertyContentAction, CreatePropertyDTO } from "@/actions/property/actions";
import { Loader2, ChevronRight, Wand2, Plus, X, LineChart, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { AnalysisMethodology } from "@/components/dashboard/properties/AnalysisMethodology";
import { motion } from "framer-motion";
import { z } from "zod";
import { RentCastInsights } from "./properties/RentCastInsights";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getScheduleAction, updateScheduleAction } from "@/actions/agenda/actions";
import { ScheduleEntityType, DaySchedule } from "@/backend/agenda/domain/Schedule";
import { ScheduleConfigurator } from "@/components/agenda/ScheduleConfigurator";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

function SortableImage({ id, url, onRemove }: { id: string, url: string, onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group cursor-grab active:cursor-grabbing">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Property preview" className="w-full h-full object-cover pointer-events-none" />
            <button
                type="button"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <X size={12} />
            </button>
        </div>
    );
}

// Create a schema specifically for the form that omits system fields
const FormSchema = PropertySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    rentCastData: true // Don't manage rentCastData in the form inputs directly, it's a side effect of analysis
});

type FormData = z.infer<typeof FormSchema>;

import { PropertyDTO } from "@/types/property";

interface PropertyFormProps {
    initialData?: PropertyDTO | undefined;
    onSuccess: () => void;
    onCancel: () => void;
}

const STEPS = ["Basics", "Location", "Specs", "Images", "Details", "Analysis"];

export function PropertyForm({ initialData, onSuccess, onCancel }: PropertyFormProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [analyzingAi, setAnalyzingAi] = useState(false);
    const [enrichmentData, setEnrichmentData] = useState<any>(initialData?.rentCastData || null); // Store RentCast data defined in PropertySchema
    const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});
    const googleMapsKey: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    // -- Schedule State --
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [timezone, setTimezone] = useState('America/New_York');
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        if (initialData?.id) {
            setLoadingSchedule(true);
            getScheduleAction(initialData.id, ScheduleEntityType.PROPERTY)
                .then(res => {
                    if (res && res.weeklySchedule) {
                        setSchedule(res.weeklySchedule);
                        setTimezone(res.timezone);
                    }
                })
                .catch(err => console.error("Could not load property schedule", err))
                .finally(() => setLoadingSchedule(false));
        }
    }, [initialData]);

    const savePropertySchedule = async () => {
        if (!initialData?.id) return;
        setIsSavingSchedule(true);
        try {
            await updateScheduleAction(initialData.id, ScheduleEntityType.PROPERTY, {
                timezone,
                weeklySchedule: schedule
            });
            alert('Property schedule saved successfully!');
            setShowScheduleModal(false); // Close modal on success
        } catch (error) {
            console.error(error);
            alert('Failed to save schedule.');
        } finally {
            setIsSavingSchedule(false);
        }
    };

    // -- Custom Places API (New) Integration --
    const [addressQuery, setAddressQuery] = useState("");
    const [placesSuggestions, setPlacesSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fetchingPlace, setFetchingPlace] = useState(false);

    // Debounced Search for Autocomplete
    useEffect(() => {
        if (!addressQuery || addressQuery.length < 3) {
            setPlacesSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': googleMapsKey,
                    },
                    body: JSON.stringify({
                        input: addressQuery,
                        includedRegionCodes: ["US"]
                    })
                });

                const data = await res.json();
                if (data.suggestions) {
                    setPlacesSuggestions(data.suggestions);
                }
            } catch (err) {
                console.error("Places API Autocomplete Error:", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [addressQuery, googleMapsKey]);

    const handleSelectPlace = async (placeId: string, description: string) => {
        setAddressQuery(description);
        setShowSuggestions(false);
        setFetchingPlace(true);

        try {
            // Fetch Place Details
            const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=addressComponents,formattedAddress,name,location`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': googleMapsKey,
                    'X-Goog-FieldMask': 'addressComponents,formattedAddress,name,location'
                }
            });

            const data = await res.json();

            if (data && data.addressComponents) {
                let address = "";
                let city = "";
                let state = "";
                let zip = "";
                let country = "";

                // Parse standard Google components
                for (const component of data.addressComponents) {
                    const types = component.types;
                    if (types.includes("street_number")) {
                        address = component.longText;
                    } else if (types.includes("route")) {
                        address = address ? `${address} ${component.longText}` : component.longText;
                    } else if (types.includes("locality") || types.includes("postal_town") || types.includes("sublocality_level_1")) {
                        city = city || component.longText;
                    } else if (types.includes("administrative_area_level_1")) {
                        state = component.shortText;
                    } else if (types.includes("country")) {
                        country = component.longText;
                    } else if (types.includes("postal_code")) {
                        zip = component.longText;
                    }
                }

                if (!address) address = data.formattedAddress || "";

                // Update form explicitly
                setValue("location.address", address || "", { shouldValidate: true });
                if (city) setValue("location.city", city, { shouldValidate: true });
                if (state) setValue("location.state", state, { shouldValidate: true });
                if (zip) setValue("location.zip", zip, { shouldValidate: true });
                if (country) setValue("location.country", country, { shouldValidate: true });

                // Set Coordinates!
                if (data.location && typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
                    setValue("location.coordinates", {
                        lat: data.location.latitude,
                        lng: data.location.longitude
                    }, { shouldValidate: true });
                }
            }
        } catch (err) {
            console.error("Place Details Error:", err);
        } finally {
            setFetchingPlace(false);
        }
    };
    // ------------------------------------------

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            price: initialData.price,
            type: initialData.type,
            status: initialData.status,
            features: initialData.features,
            images: initialData.images,
            location: initialData.location,
            specs: initialData.specs,
            description: initialData.description
        } : {
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

        const files = Array.from(e.target.files);
        const initialProgress = { ...uploadProgress };
        files.forEach(f => initialProgress[f.name] = 0);
        setUploadProgress(initialProgress);

        try {
            const { storage } = await import("@/lib/firebase/client");
            const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");

            const uploadPromises = files.map((file) => {
                return new Promise<string>((resolve, reject) => {
                    if (file.size > 100 * 1024 * 1024) {
                        reject(new Error(`File ${file.name} exceeds 100MB limit`));
                        return;
                    }
                    const path = `properties/uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
                    const storageRef = ref(storage, path);
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                        },
                        (error) => {
                            console.error("Upload error", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            setUploadProgress(prev => {
                                const copy = { ...prev };
                                delete copy[file.name];
                                return copy;
                            });
                            resolve(downloadURL);
                        }
                    );
                });
            });

            const urls = await Promise.all(uploadPromises);
            const currentImages = watchedValues.images || [];
            setValue("images", [...currentImages, ...urls], { shouldValidate: true });

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
            setUploadProgress({});
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const currentImages = watchedValues.images || [];
            const oldIndex = currentImages.indexOf(active.id as string);
            const newIndex = currentImages.indexOf(over.id as string);
            setValue("images", arrayMove(currentImages, oldIndex, newIndex), { shouldValidate: true });
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        let result;

        if (initialData) {
            // Clean data to remove undefined values
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            result = await updatePropertyAction({
                id: initialData.id,
                ...cleanData,
                rentCastData: enrichmentData // Include enrichment data if available
            });
        } else {
            result = await createPropertyAction({
                ...data,
                rentCastData: enrichmentData // Include enrichment data if available
            } as unknown as CreatePropertyDTO);
        }

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
            case 5: fieldsToValidate = []; break; // Analysis is optional/generated
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
                <label className="block text-sm font-medium text-foreground mb-1">Property Title</label>
                <input
                    {...register("title")}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground transition-all"
                    placeholder="e.g. Modern Villa in Downtown"
                />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                    <select {...register("type")} className="w-full px-3 py-2 border border-input rounded-lg outline-none bg-background text-foreground focus:ring-2 focus:ring-ring transition-all">
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select {...register("status")} className="w-full px-3 py-2 border border-input rounded-lg outline-none bg-background text-foreground focus:ring-2 focus:ring-ring transition-all">
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">Price</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                    <input
                        type="number"
                        {...register("price.amount", { valueAsNumber: true })}
                        className="w-full pl-7 pr-3 py-2 border border-input rounded-lg outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all"
                        placeholder="0.00"
                    />
                </div>
                {errors.price?.amount && <p className="text-destructive text-xs mt-1">{errors.price.amount.message}</p>}
            </div>

            {/* Property Availability Summary & Modal Trigger */}
            {initialData?.id && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-indigo-100/60 dark:border-slate-700 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Viewing Availability
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {loadingSchedule
                                    ? "Loading current availability..."
                                    : schedule.filter(s => s.isActive).length > 0
                                        ? `${schedule.filter(s => s.isActive).length} active days configured for this property.`
                                        : "Using global availability settings."
                                }
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowScheduleModal(true)}
                            disabled={loadingSchedule}
                            className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent dark:border-indigo-800/50 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                        >
                            Configure Schedule
                        </button>
                    </div>

                    {showScheduleModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/40 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col">
                                <div className="sticky top-0 z-10 flex justify-between items-center p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Configure Viewing Hours</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Override global settings for this specific property.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 md:p-6 pb-24 overflow-x-hidden">
                                    <ScheduleConfigurator
                                        schedule={schedule}
                                        onChange={setSchedule}
                                        timezone={timezone}
                                        onTimezoneChange={setTimezone}
                                        onSave={savePropertySchedule}
                                        isSaving={isSavingSchedule}
                                        title=""
                                        description=""
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderLocation = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address Capture (Google Maps API New)</label>
                <div className="relative">
                    <input
                        type="text"
                        value={addressQuery}
                        onChange={(e) => {
                            setAddressQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Start typing an address..."
                        className="w-full px-3 py-2 border border-input rounded-lg outline-none max-w-xl shadow-sm focus:border-ring focus:ring-2 focus:ring-ring mb-2 bg-background text-foreground placeholder:text-muted-foreground transition-all"
                        disabled={fetchingPlace}
                    />
                    {fetchingPlace && (
                        <div className="absolute right-3 top-3">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                        </div>
                    )}
                    {showSuggestions && placesSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full max-w-xl bg-card border border-border shadow-md rounded-md max-h-60 overflow-y-auto top-12 left-0 text-sm text-card-foreground">
                            {placesSuggestions.map((sg) => (
                                <li
                                    key={sg.placePrediction.placeId}
                                    className="px-4 py-2 hover:bg-muted cursor-pointer border-b last:border-0 border-border flex items-center justify-between transition-colors"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent input onBlur from hiding the dropdown
                                        handleSelectPlace(sg.placePrediction.placeId, sg.placePrediction.text.text);
                                    }}
                                >
                                    <span className="truncate">{sg.placePrediction.text.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <input
                    {...register("location.address")}
                    className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all placeholder:text-muted-foreground"
                    placeholder="Street Address"
                />
                {errors.location?.address && <p className="text-destructive text-xs mt-1">{errors.location.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">City</label>
                    <input {...register("location.city")} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">State</label>
                    <input {...register("location.state")} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Zip Code</label>
                    <input {...register("location.zip")} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                    <input {...register("location.country")} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
            </div>
        </div>
    );

    const renderSpecs = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Beds</label>
                    <input type="number" {...register("specs.beds", { valueAsNumber: true })} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Baths</label>
                    <input type="number" {...register("specs.baths", { valueAsNumber: true })} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Area</label>
                    <input type="number" {...register("specs.area", { valueAsNumber: true })} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                    <select {...register("specs.areaUnit")} className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all">
                        <option value="sqft">sqft</option>
                        <option value="m2">m²</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderImages = () => (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                />
                <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Click to upload images</p>
                    <p className="text-xs">PNG, JPG, WEBP up to 100MB</p>
                </div>
            </div>

            {/* Upload Progress List */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2 mt-4">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{fileName}</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Preview List */}
            {watchedValues.images && watchedValues.images.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={watchedValues.images} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            {watchedValues.images.map((img: string) => (
                                <SortableImage
                                    key={img}
                                    id={img}
                                    url={img}
                                    onRemove={(id) => {
                                        const newImages = [...(watchedValues.images || [])];
                                        const idx = newImages.indexOf(id);
                                        if (idx > -1) {
                                            newImages.splice(idx, 1);
                                            setValue("images", newImages);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );

    const renderDetails = () => (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-foreground">Description</label>
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingAi}
                        className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                    >
                        {generatingAi ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {generatingAi ? "Generating..." : "AI Generate"}
                    </button>
                </div>
                <textarea
                    {...register("description")}
                    className="w-full min-h-[128px] px-3 py-2 border border-input rounded-lg outline-none resize-y focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all placeholder:text-muted-foreground"
                    placeholder="Describe the property..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">Features (comma separated)</label>
                <Controller
                    name="features"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            placeholder="Pool, Gym, Fireplace..."
                            defaultValue={field.value?.join(", ")}
                            className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all placeholder:text-muted-foreground"
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

    const handleAnalyzeProperty = async () => {
        const data = watchedValues;

        // Basic validation
        if (!data.title || !data.price?.amount || !data.location?.city) {
            alert("Please fill in basic property details (Title, Price, Location) before analyzing.");
            return;
        }

        setAnalyzingAi(true);
        const result = await analyzePropertyContentAction(data);

        if (result.success && result.analysis) {
            setValue("opportunityScore", result.analysis.opportunityScore);
            setValue("listingQualityScore", result.analysis.listingQualityScore);
            setValue("marketStatus", result.analysis.marketStatus);
            setValue("investmentAnalysis", result.analysis.investmentAnalysis);
            if (result.enrichmentData) {
                setEnrichmentData(result.enrichmentData);
            }
        } else {
            alert("Failed to analyze property.");
        }
        setAnalyzingAi(false);
    };

    const renderAnalysis = () => {
        const analysis = watchedValues.investmentAnalysis;
        const oppScore = watchedValues.opportunityScore;
        const qualityScore = watchedValues.listingQualityScore;

        return (
            <div className="space-y-6">
                {/* RentCast Verified Data Display */}
                {enrichmentData && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <RentCastInsights data={enrichmentData} />
                    </motion.div>
                )}

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                <LineChart className="text-indigo-600 dark:text-indigo-400" size={20} />
                                AI Investment Analysis
                            </h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                                Generate a comprehensive investment report, opportunity score, and listing quality assessment.
                            </p>
                            <div className="mt-2">
                                <AnalysisMethodology />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAnalyzeProperty}
                            disabled={analyzingAi}
                            className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2"
                        >
                            {analyzingAi ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {analyzingAi ? "Analyzing..." : "Run Analysis"}
                        </button>
                    </div>

                    {!analysis && !analyzingAi && (
                        <div className="text-center py-8 text-indigo-400 text-sm border-2 border-dashed border-indigo-200 rounded-lg bg-white/50">
                            Click &quot;Run Analysis&quot; to generate insights.
                        </div>
                    )}

                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Scores */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Opportunity Score</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Investment Potential</p>
                                    </div>
                                    <div className={`text-2xl font-bold ${(oppScore || 0) >= 80 ? 'text-emerald-600' : (oppScore || 0) >= 60 ? 'text-amber-600' : 'text-slate-600'
                                        }`}>
                                        {oppScore ?? '-'}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Quality Score</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Listing Completeness</p>
                                    </div>
                                    <div className={`text-2xl font-bold ${(qualityScore || 0) >= 80 ? 'text-emerald-600' : (qualityScore || 0) >= 60 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {qualityScore ?? '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Proj. ROI</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-500">{analysis.roi}%</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Cap Rate</p>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-500">{analysis.capRate}%</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Cash Flow</p>
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-500">${analysis.cashFlow}/mo</p>
                                </div>
                            </div>

                            {/* Analysis Text */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                    &quot;{analysis.description}&quot;
                                </p>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p>This analysis is AI-generated based on provided data and general market trends. Always verify with professional appraisal.</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Steps Indicator */}
            <div className="relative flex items-start justify-between mb-8 px-2">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex flex-col items-center relative z-10 w-16">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${step >= i ? "bg-slate-900 dark:bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>
                            {i + 1}
                        </div>
                        <span className={`text-[10px] mt-2 font-medium text-center ${step >= i ? "text-slate-900 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                            }`}>{s}</span>
                    </div>
                ))}
                {/* Progress Line */}
                <div className="absolute left-10 right-10 top-4 h-[2px] bg-slate-200 dark:bg-slate-800 -z-0" />
                <div
                    className="absolute left-10 top-4 h-[2px] bg-slate-900 dark:bg-indigo-500 -z-0 transition-all duration-300"
                    style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 5rem)` }}
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
                    {step === 5 && renderAnalysis()}
                </motion.div>
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                    onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
                    disabled={loading}
                >
                    {step === 0 ? "Cancel" : "Back"}
                </button>

                <div className="flex items-center gap-3">
                    {/* Direct Save Button for Edit Mode */}
                    {initialData && step < STEPS.length - 1 && (
                        <button
                            type="button"
                            onClick={() => handleSubmit(onSubmit)()}
                            disabled={loading}
                            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />} Save Changes
                        </button>
                    )}

                    {/* Primary Flow Button */}
                    <button
                        type="button"
                        onClick={async () => {
                            if (step === STEPS.length - 1) {
                                await handleSubmit(onSubmit)();
                            } else {
                                await nextStep();
                            }
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Saving...
                            </>
                        ) : step === STEPS.length - 1 ? (
                            initialData ? "Update Property" : "Create Property"
                        ) : (
                            <>
                                Next <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
