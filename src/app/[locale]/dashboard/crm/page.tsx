"use client";

import { KanbanBoard } from "@/components/dashboard/KanbanBoard";

export default function CRMDashboardPage() {
    return (
        <div className="h-[calc(100vh-120px)]">
            <KanbanBoard />
        </div>
    );
}
