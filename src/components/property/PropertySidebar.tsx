"use client";

import { PropertyDTO } from "@/types/property";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/formatters";

interface PropertySidebarProps {
    property: PropertyDTO;
}

export function PropertySidebar({ property }: PropertySidebarProps) {
    const isForRent = property.type === 'rent';
    const statusLabel = isForRent ? 'For Rent' : 'For Sale';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-24 h-fit p-6 bg-white border border-slate-200 rounded-2xl shadow-sm"
        >
            <div className="mb-6">
                <span className={`text-sm font-bold uppercase tracking-wider ${isForRent ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {statusLabel}
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    {formatPrice(property.price.amount)}
                    {isForRent && <span className="text-lg text-slate-500 font-normal">/month</span>}
                </h2>
            </div>

            <p className="text-sm text-slate-500 mb-6">
                Get in touch for more about this property
            </p>

            <div className="flex flex-col gap-3">
                <Button fullWidth size="lg">
                    Request Info
                </Button>
                <Button fullWidth variant="outline" size="lg">
                    Schedule Tour
                </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        NV
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-900">Nelson Vallejo</p>
                        <p className="text-xs text-slate-500">Real Estate Advisor</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
