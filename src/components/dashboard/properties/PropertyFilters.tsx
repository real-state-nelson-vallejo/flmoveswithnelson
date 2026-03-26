import { Search, SlidersHorizontal, LayoutGrid, List, Info } from "lucide-react";
import { AnalysisMethodology } from "@/components/dashboard/properties/AnalysisMethodology";

interface PropertyFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    viewMode: 'grid' | 'table';
    setViewMode: (mode: 'grid' | 'table') => void;
    opportunitiesOnly: boolean;
    setOpportunitiesOnly: (val: boolean) => void;
}

export function PropertyFilters({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    opportunitiesOnly,
    setOpportunitiesOnly
}: PropertyFiltersProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setOpportunitiesOnly(false)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${!opportunitiesOnly ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                >
                    All Properties
                </button>
                <button
                    onClick={() => setOpportunitiesOnly(true)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${opportunitiesOnly ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-blue-500/30 font-bold' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 font-bold'}`}
                >
                    🔥 Smart Inbox (High ROI)
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border">
                {/* Search */}
                <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50 text-foreground"
                />
            </div>

            {/* Methodology Button */}
            <div className="hidden md:block">
                <AnalysisMethodology>
                    <button
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border"
                        title="AI Analysis Methodology"
                    >
                        <Info size={18} />
                    </button>
                </AnalysisMethodology>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Status Filter */}
                <div className="relative flex-1 md:flex-none">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-40 pl-3 pr-8 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-foreground cursor-pointer"
                    >
                        <option value="all">All MLS Status</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
                </div>

                {/* View Toggle */}
                <div className="flex bg-secondary p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Table View"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}
