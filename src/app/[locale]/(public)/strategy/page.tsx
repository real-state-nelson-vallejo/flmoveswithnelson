import {
    Target, Lock, Zap, Database, ArrowRight, Activity, Sparkles, MapPin,
    Tag, Archive, Users, Gauge, Workflow, BellRing, Clock,
} from "lucide-react";

export default function StrategyExplainerPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-10">

                {/* HERO */}
                <header className="text-center space-y-5 mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        <Zap size={16} className="fill-blue-600" />
                        System overview · v3
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        How your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">real-estate platform</span> works
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        A field guide to every automated piece behind flmoveswithnelson.com — from the MLS pipeline that fills your inventory to the AI that captures leads while you sleep.
                    </p>
                </header>

                {/* 1. MARKET STRATEGY */}
                <Section
                    icon={<Target size={28} />}
                    iconClass="bg-indigo-50 text-indigo-600"
                    title="1. The market you dominate"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Your target is <strong>Central Florida</strong> — Polk, Orange, Osceola, Hillsborough, Pinellas, Lake, Seminole, Volusia and surrounding counties. All of that inventory lives in <strong>Stellar MLS</strong>, the largest MLS in the state.
                    </p>
                    <Callout>
                        Stellar MLS has hundreds of thousands of active listings. Downloading every one of them every day would be wasteful. Instead, we sync strategically: you pick the zones you care about, we cache them locally, and everything else is pulled on demand only when a buyer asks for it.
                    </Callout>
                </Section>

                {/* 2. QUICK SYNC */}
                <Section
                    icon={<Zap size={28} />}
                    iconClass="bg-amber-50 text-amber-600"
                    title="2. Quick Sync — one-click inventory"
                >
                    <p className="text-slate-600 leading-relaxed mb-5">
                        On your dashboard (<code className="bg-slate-100 px-1.5 py-0.5 rounded">/dashboard/properties</code>) there’s a <strong>Quick Sync</strong> bar with three one-click options:
                    </p>
                    <div className="grid gap-3 mb-5">
                        <MiniCard
                            label="My Listings"
                            tone="blue"
                            desc="Pulls only the properties where you are the listing agent (your Stellar agent ID)."
                        />
                        <MiniCard
                            label="Brokerage"
                            tone="purple"
                            desc="Pulls every active listing of FL Moves — useful if you want to showcase the whole office."
                        />
                        <MiniCard
                            label="Zone / County"
                            tone="emerald"
                            desc="Enter ZIPs, cities or counties separated by commas (e.g. 33612, Tampa, Polk). The input shows parsed chips live so you always know what Bridge will receive."
                        />
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                        Any of the three buttons opens a preview with <strong>the exact property count</strong> from Stellar MLS and an estimated processing time before anything gets queued. You get to decide before anything runs.
                    </p>
                    <Callout>
                        Optional filters above the buttons — <em>Listing type</em> (For Sale / For Rent) and <em>Max price</em> — apply to all three. If you only want Tampa listings under $500k, set the filters once and click any button.
                    </Callout>
                </Section>

                {/* 3. FAST vs QUALITY */}
                <Section
                    icon={<Gauge size={28} />}
                    iconClass="bg-blue-50 text-blue-600"
                    title="3. Fast vs. Quality — two sync modes"
                >
                    <p className="text-slate-600 leading-relaxed mb-5">
                        After the preview, you choose how the sync runs:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <ModeCard
                            icon={<Sparkles size={16} />}
                            title="Quality (recommended first time)"
                            body="Every property is re-indexed with AI embeddings so the chatbot and semantic search find them perfectly. Costs a few AI tokens per property. Use when loading a new zone or refreshing everything."
                            accent="bg-blue-600 text-white"
                        />
                        <ModeCard
                            icon={<Zap size={16} />}
                            title="Fast (daily refresh)"
                            body="Skips re-indexing properties whose description didn’t change. Same data is saved, but no AI tokens are spent on unchanged listings. 3–4× faster and much cheaper. Use for daily refreshes after the first full sync."
                            accent="bg-slate-900 text-white"
                        />
                    </div>
                </Section>

                {/* 4. SPLIT + PAUSE */}
                <Section
                    icon={<Workflow size={28} />}
                    iconClass="bg-rose-50 text-rose-600"
                    title="4. Large syncs split themselves automatically"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        When a sync would touch more than ~800 properties, the preview suggests dividing it into sub-jobs by city, county or price range. Each sub-job is queued and processed <strong>in sequence</strong>, so the pipeline never gets overwhelmed.
                    </p>
                    <ol className="space-y-3 mb-5">
                        <StepItem n={1}>The Sync Queue bar at the bottom of your dashboard shows each job and its progress in real time.</StepItem>
                        <StepItem n={2}>You can <strong>pause</strong> any active job. Progress is saved — when you resume, it continues from where it left off without re-processing anything.</StepItem>
                        <StepItem n={3}>If a sync takes longer than 9 minutes of continuous work, the worker auto-reschedules itself behind the scenes (you don’t need to do anything).</StepItem>
                        <StepItem n={4}>Jobs that take more than 5 minutes trigger an <strong>email summary</strong> and an in-app notification when they finish.</StepItem>
                    </ol>
                </Section>

                {/* 5. LAZY SEEDING */}
                <Section
                    icon={<Lock size={28} />}
                    iconClass="bg-emerald-50 text-emerald-600"
                    title="5. Lazy seeding — turning empty searches into leads"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        A buyer lands on your site and searches <em>Winter Haven</em>. If you haven’t synced Winter Haven yet, this is what happens in milliseconds:
                    </p>
                    <ol className="space-y-4 mb-5">
                        <StepItem n={1}>
                            <strong>Silent ping.</strong> The website quietly asks Stellar MLS: <em>“Do you have active homes in Winter Haven?”</em>
                        </StepItem>
                        <StepItem n={2}>
                            <strong>The teaser.</strong> Stellar answers <em>“Yes — 1,023 active listings.”</em> Your site shows a screen: <em>“Great news! We located 1,023 active listings.”</em>
                        </StepItem>
                        <StepItem n={3}>
                            <strong>OTP capture.</strong> To see the listings, the visitor provides an email and verifies it with a 6-digit code. You now have a <strong>verified lead</strong> in your CRM.
                        </StepItem>
                        <StepItem n={4}>
                            <strong>Organic seeding.</strong> As a thank-you, we pull the first 20 matching listings from Stellar into your database so the visitor actually sees results. The rest stay on-demand.
                        </StepItem>
                    </ol>
                    <Callout>
                        The lead and their search criteria are saved. Every time a future sync brings in listings that match what they searched for, they get an email alert with the new matches.
                    </Callout>
                </Section>

                {/* 6. EDITORIAL TAGS */}
                <Section
                    icon={<Tag size={28} />}
                    iconClass="bg-purple-50 text-purple-600"
                    title="6. Editorial tagging — curate your home page"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Any property in your dashboard can be tagged into one or more <strong>home sections</strong>. Each section on the public home is driven by these tags — if you change them, the home updates automatically (no deploys).
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 mb-5">
                        <TagChip color="blue">Featured</TagChip>
                        <TagChip color="amber">Luxury</TagChip>
                        <TagChip color="cyan">Waterfront</TagChip>
                        <TagChip color="emerald">New Today</TagChip>
                        <TagChip color="purple">Investor Deals</TagChip>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                        Click the tag icon on any property card in the dashboard, check the sections where it should appear, and save. The home page refreshes within seconds.
                    </p>
                </Section>

                {/* 7. ARCHIVE */}
                <Section
                    icon={<Archive size={28} />}
                    iconClass="bg-amber-50 text-amber-600"
                    title="7. Automatic archiving when a listing leaves the market"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        When Stellar MLS reports a property as Pending, Closed or withdrawn, the next sync flips it to <strong>archived</strong>:
                    </p>
                    <ul className="space-y-2 mb-5">
                        <BulletItem>The property disappears from the public search and map.</BulletItem>
                        <BulletItem>Its detail page shows a clear banner: <em>“This property is no longer available”</em> with links to similar homes in the same city.</BulletItem>
                        <BulletItem>Historical data is preserved — leads who saved it, prior conversations, and embeddings all stay.</BulletItem>
                        <BulletItem>In the dashboard you can toggle between <em>All</em> and <em>Only active</em> to view or hide archived listings.</BulletItem>
                    </ul>
                    <Callout>
                        If the property comes back on-market, the sync automatically un-archives it and it reappears on the public site.
                    </Callout>
                </Section>

                {/* 8. AI + CHATBOT */}
                <Section
                    icon={<Sparkles size={28} />}
                    iconClass="bg-indigo-50 text-indigo-600"
                    title="8. AI chatbot and semantic search"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Every property in your database gets a <strong>semantic fingerprint</strong> (a Gemini embedding) — a mathematical representation of its description, specs, and location. That’s what powers:
                    </p>
                    <ul className="space-y-2 mb-5">
                        <BulletItem><strong>Natural-language search</strong> — buyers can type <em>“3-bedroom with pool near downtown Tampa under 600k”</em> and get relevant results, even if the listing description doesn’t contain those exact words.</BulletItem>
                        <BulletItem><strong>The website chatbot</strong> — handles inbound questions 24/7, shows relevant listings, books tours, and escalates to you via SMS/voice when needed (Twilio).</BulletItem>
                        <BulletItem><strong>Similar-properties module</strong> on every detail page — finds 3 homes in the same city within ±20% of the listed price.</BulletItem>
                    </ul>
                    <Callout>
                        The chatbot and semantic search always read from your local database. If the buyer searches something you haven’t synced yet, the lazy-seeding flow (section 5) kicks in.
                    </Callout>
                </Section>

                {/* 9. SYNC HEALTH */}
                <Section
                    icon={<Activity size={28} />}
                    iconClass="bg-blue-50 text-blue-600"
                    title="9. Sync Health — know what’s running"
                >
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Two tools let you keep an eye on the pipeline:
                    </p>
                    <ul className="space-y-2 mb-5">
                        <BulletItem>
                            <strong>Sync Queue bar</strong> (bottom of every dashboard page) — live view of active jobs, last completed, and a one-click pause/resume for anything in progress.
                        </BulletItem>
                        <BulletItem>
                            <strong>Sync Health page</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/dashboard/sync-health</code>) — log of the daily automated runs of the MLS cron: what was fetched, how long it took, and any errors. One row per cron execution.
                        </BulletItem>
                    </ul>
                </Section>

                {/* 10. CRON */}
                <Section
                    icon={<BellRing size={28} />}
                    iconClass="bg-slate-100 text-slate-700"
                    title="10. Automated daily refresh (CRON)"
                >
                    <p className="text-slate-600 leading-relaxed mb-5">
                        Two independent background jobs run every day without you doing anything. This is what keeps your data fresh.
                    </p>

                    {/* CRON 1 — MLS sync */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <Clock size={11} /> 04:00 + 16:00 UTC
                            </span>
                            <h3 className="font-bold text-slate-900">MLS delta sync · twice a day</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Runs two tasks in sequence against Stellar MLS, then logs the result in Sync Health.
                        </p>
                        <ol className="space-y-3">
                            <li className="flex gap-3 items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-200 text-blue-700 font-bold text-xs shrink-0 mt-0.5">1</span>
                                <div className="text-sm text-slate-700">
                                    <strong className="text-slate-900">General market delta.</strong> Pulls every Stellar MLS listing whose <em>ModificationTimestamp</em> changed in the last 24 hours (up to 50 per run). For each one:
                                    <ul className="mt-2 space-y-1 text-slate-600 text-[13px] pl-4 list-disc">
                                        <li>Updates price, status, media, and description on your existing record (or creates a new one).</li>
                                        <li>Re-indexes it for semantic search / chatbot (Gemini embedding).</li>
                                        <li>If the price <strong>dropped</strong>, emails every lead whose saved search matches.</li>
                                        <li>If the listing is no longer <em>Active</em> (Pending / Closed), <strong>auto-archives</strong> it — it disappears from the public site but stays in your audit trail.</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-200 text-blue-700 font-bold text-xs shrink-0 mt-0.5">2</span>
                                <div className="text-sm text-slate-700">
                                    <strong className="text-slate-900">Your personal inventory refresh.</strong> Runs the same flow but filtered to listings where <em>you</em> are the listing agent. This guarantees your own listings are always up to date, even if the first task missed them because no field changed in the last 24 hours.
                                </div>
                            </li>
                        </ol>
                        <p className="text-xs text-slate-500 mt-4 italic">
                            Result: one entry in <code className="bg-white px-1 rounded">syncRuns</code> with how many properties were processed, the duration, and success/error status. This is what the “Last daily cron” tile on your dashboard shows.
                        </p>
                    </div>

                    {/* CRON 2 — Scalper */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <Clock size={11} /> 05:00 UTC
                            </span>
                            <h3 className="font-bold text-slate-900">Market opportunity scanner · once a day</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Scans the ZIPs you configured and detects below-market deals. Independent from the MLS sync — it writes to a separate <em>opportunities</em> collection.
                        </p>
                        <p className="text-sm text-slate-700 mb-2">For each listing in the target ZIPs it fetches an AVM (estimated value) + rental estimate, then applies two rules:</p>
                        <ul className="space-y-2 text-sm">
                            <BulletItem>
                                <strong>Flip opportunity</strong> — listing price is at least 10% below estimated market value. Tagged <em>flip</em> with the discount amount.
                            </BulletItem>
                            <BulletItem>
                                <strong>Cashflow opportunity</strong> — estimated Cap Rate above 6% (roughly: annual rent × 0.6 ÷ listing price). Tagged <em>cashflow</em> with the cap rate.
                            </BulletItem>
                        </ul>
                        <p className="text-xs text-slate-500 mt-4 italic">
                            Matches show up in the <strong>Smart Inbox (High ROI)</strong> filter on your Properties page and on the Opportunities dashboard — no email by default, you pull them when you’re hunting.
                        </p>
                    </div>

                    <Callout>
                        Everything logged on the Sync Health page belongs to the MLS delta sync. The scanner is silent on days when nothing matches — if you see no new opportunities, nothing unusual happened.
                    </Callout>
                </Section>

                {/* 11. DATA FLOW SUMMARY */}
                <Section
                    icon={<Database size={28} />}
                    iconClass="bg-slate-100 text-slate-700"
                    title="11. The full data flow at a glance"
                >
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 font-mono text-[11px] leading-relaxed overflow-x-auto">
                        <div className="text-slate-600 whitespace-pre">{`Stellar MLS (Bridge API)
        │
        │ ─── Quick Sync (manual, 1-click)
        │ ─── Advanced Sync (manual, filters + map)
        │ ─── Daily CRON (automated 04:00 + 16:00 UTC)
        │ ─── Lazy Seed (triggered by empty buyer searches)
        ▼
Cloud Function worker
  (pause/resume · auto-split · Fast/Quality · auto-archive)
        │
        ▼
Firestore  ◀───  PropertyStats aggregation (live counters)
        │
        ├─► Gemini embedding  →  semantic index
        │
        ├─► Public website (home · /properties · map · detail pages)
        │
        └─► AI chatbot  ◀── handles inbound questions, books tours
                       ◀── escalates via Twilio SMS/voice

       Leads + Saved Searches
               │
               ▼
      Email alerts on new matches + CRM pipeline`}
                        </div>
                    </div>
                </Section>

                {/* CLOSING CTA */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white">
                    <Users size={36} className="mx-auto mb-4" />
                    <h2 className="text-3xl font-black mb-3">Your platform is a lead-capture machine</h2>
                    <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                        Every search, every click, every conversation is an opportunity — and the whole pipeline runs itself while you focus on closing.
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
                    >
                        Open your dashboard <ArrowRight size={18} />
                    </a>
                </div>
            </div>
        </main>
    );
}

/* ---------- Reusable inline components ---------- */

function Section({
    icon, iconClass, title, children,
}: { icon: React.ReactNode; iconClass: string; title: string; children: React.ReactNode; }) {
    return (
        <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className={`p-4 rounded-2xl flex-shrink-0 ${iconClass}`}>
                    {icon}
                </div>
                <div className="w-full min-w-0">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
                    {children}
                </div>
            </div>
        </section>
    );
}

function Callout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 border-l-4 border-l-indigo-500 text-sm text-slate-700 italic">
            {children}
        </div>
    );
}

function StepItem({ n, children }: { n: number; children: React.ReactNode }) {
    return (
        <li className="flex gap-4 items-start">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm shrink-0 mt-0.5">{n}</span>
            <div className="flex-1 text-sm text-slate-600 leading-relaxed">{children}</div>
        </li>
    );
}

function BulletItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
            <div>{children}</div>
        </li>
    );
}

function MiniCard({ label, desc, tone }: { label: string; desc: string; tone: "blue" | "purple" | "emerald" }) {
    const tones: Record<string, string> = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        purple: "bg-purple-50 border-purple-200 text-purple-700",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
    return (
        <div className={`rounded-xl border ${tones[tone]} p-4`}>
            <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} />
                <span className="font-bold text-sm">{label}</span>
            </div>
            <p className="text-xs text-slate-600">{desc}</p>
        </div>
    );
}

function ModeCard({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-5">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 ${accent}`}>
                {icon} {title.split(" ")[0]}
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
        </div>
    );
}

function TagChip({ color, children }: { color: "blue" | "amber" | "cyan" | "emerald" | "purple"; children: React.ReactNode }) {
    const tones: Record<string, string> = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        amber: "bg-amber-50 border-amber-200 text-amber-700",
        cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
        purple: "bg-purple-50 border-purple-200 text-purple-700",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-sm ${tones[color]}`}>
            <Tag size={12} /> {children}
        </span>
    );
}
