export default function DashboardIndex() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase">Total Properties</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase">Active Leads</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">45</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase">Pending Actions</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">3</p>
            </div>
        </div>
    );
}
