"use client";

import { KanbanBoard } from "@/components/dashboard/KanbanBoard";

export default function CRMDashboardPage() {
    return (
        <div className="h-[calc(100vh-90px)] pt-4 px-4 md:pt-8 md:px-8 pb-0 max-w-[1800px] mx-auto">
            <KanbanBoard />
        </div>
    );
}
