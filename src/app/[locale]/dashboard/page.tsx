"use client";

import { Building2, Users, TrendingUp } from "lucide-react";

export default function DashboardIndex() {
    return (
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-8">
            <h1 className="text-3xl font-light tracking-tight text-foreground">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Properties</h3>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Building2 size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-mono text-foreground font-medium">12</p>
                    <p className="text-xs text-muted-foreground mt-2">+2 added this month</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Leads</h3>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Users size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-mono text-foreground font-medium">45</p>
                    <p className="text-xs text-emerald-500 mt-2 font-medium">+12% vs last month</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opportunities</h3>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-mono text-foreground font-medium">8</p>
                    <p className="text-xs text-muted-foreground mt-2">3 new found today</p>
                </div>
            </div>
        </div>
    );
}
