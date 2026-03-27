import { Target, Search, Lock, Zap, MapPin, Database, Award, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function StrategyExplainerPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* HERO */}
                <header className="text-center space-y-6 mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4">
                        <Zap size={16} className="fill-blue-600" />
                        System Architecture V2.0
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        How Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intelligent Real Estate Portal</span> Works
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        We’ve upgraded your website from a passive brochure into an autonomous <strong>Intelligent Lead Capture Ecosystem</strong>. Here is the blueprint of your new machine.
                    </p>
                </header>

                {/* 1. THE STRATEGY */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="bg-indigo-50 p-4 rounded-2xl flex-shrink-0 text-indigo-600">
                            <Target size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. The Strategy: Playing Your Home Field Advantage</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Your target market is <strong>Central Florida</strong> (Polk County, Orange, Osceola, etc.). This is where you operate, and this is where <strong>Stellar MLS</strong> is the undisputed giant.
                            </p>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 border-l-4 border-l-indigo-500 text-sm text-slate-700 italic">
                                "Because Stellar MLS has millions of properties, downloading all of them onto your server every day would cost a fortune. Instead, we built <strong>The Lazy-Seeding System</strong>. Your database is now smart enough to let your website visitors do the hard work for you for free."
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. THE CAPTURE WALL */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row-reverse gap-8 items-start relative z-10">
                        <div className="bg-rose-50 p-4 rounded-2xl flex-shrink-0 text-rose-600">
                            <Lock size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. The "Teaser Wall" Lead Capture</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Imagine a buyer goes to your homepage and searches for a home in <strong>Winter Haven</strong>. If your local AI database doesn't have Winter Haven downloaded yet, here is what happens in milliseconds:
                            </p>
                            
                            <ol className="space-y-6">
                                <li className="flex gap-4 items-start">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm shrink-0 mt-0.5">1</span>
                                    <div>
                                        <h4 className="font-bold text-slate-900">The Secret Ping</h4>
                                        <p className="text-slate-600 text-sm mt-1">Your website secretly knocks on the door of the global Stellar MLS API and asks: <em>"Hey, do you have active homes in Winter Haven?"</em></p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0 mt-0.5">2</span>
                                    <div>
                                        <h4 className="font-bold text-slate-900">The Teaser</h4>
                                        <p className="text-slate-600 text-sm mt-1">Stellar MLS answers: <em>"Yes! I have 1,023 homes."</em> Your website flashes a beautiful screen saying: <strong>"Great News! We located 1,023 active listings."</strong></p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0 mt-0.5">3</span>
                                    <div>
                                        <h4 className="font-bold text-slate-900">The Trap & Capture</h4>
                                        <p className="text-slate-600 text-sm mt-1">To see the actual homes, the buyer must input their email and verify it via an OTP code. <strong>Boom. You captured a verified lead into your CRM instantly.</strong></p>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </section>

                {/* 3. THE REWARD */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-50 blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="bg-emerald-50 p-4 rounded-2xl flex-shrink-0 text-emerald-600">
                            <Database size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. The Reward & The "Snowball Effect"</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Once the buyer verifies their email, your system rewards them instantly. Behind the scenes, your server logs into Bridge, downloads the top 20 best houses in Winter Haven, runs them through the Google AI to make them "smart", and refreshes the buyer's screen.
                            </p>
                            
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Search size={20} />
                                    The Core Secret: Snowballing
                                </h3>
                                <p className="text-emerald-50 text-sm leading-relaxed">
                                    Those 20 Winter Haven homes are now permanently saved in your database. If a second buyer traces the same path an hour later, they won't even see the Teaser Wall. The homes pop up instantly for free. Every user unlocks new cities for the ecosystem organically.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. GEO-FENCING */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="bg-orange-50 p-4 rounded-2xl flex-shrink-0 text-orange-600">
                            <MapPin size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. What about Miami or outside regions?</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Your system is programmed to protect you. If a buyer searches for <strong>"Miami"</strong> or <strong>"Jacksonville"</strong>, your system knows those areas aren't in your Stellar MLS coverage. 
                                <br/><br/>
                                Instead of crashing, we protect your quota. We will set it up so that it asks them for their email so you can <strong>Refer them to a local partner for a 25% referral commission fee</strong>—turning a geographic limit into pure profit.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. ADMIN DASHBOARD SYNC */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row-reverse gap-8 items-start relative z-10">
                        <div className="bg-indigo-50 p-4 rounded-2xl flex-shrink-0 text-indigo-600">
                            <Database size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Admin Dashboard: The "Zone" Sniper</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                The system runs on autopilot (via buyers' searches and a nightly Cron Job that updates your own exclusive listings), but what if you want to push a specific neighborhood today? 
                            </p>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Database size={20} className="text-indigo-600" />
                                    The "Live MLS Sync" Modal Guide
                                </h4>
                                <ol className="space-y-6">
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">1</div>
                                        <div>
                                            <strong className="text-slate-900 block mb-1">Target Inventory Scope</strong>
                                            <p className="text-sm text-slate-600">Choose the foundation of your search:</p>
                                            <ul className="list-disc pl-4 mt-2 text-sm text-slate-500 space-y-1">
                                                <li><strong>General Market:</strong> Pulls any property from Stellar MLS (great for expanding cities).</li>
                                                <li><strong>My Listings (Nelson):</strong> Forces the system to look ONLY for properties under your Agent ID.</li>
                                                <li><strong>Brokerage (FL Moves):</strong> Pulls everything listed by the agency.</li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">2</div>
                                        <div>
                                            <strong className="text-slate-900 block mb-1">City or Zip (Optional)</strong>
                                            <p className="text-sm text-slate-600">If you selected "General Market" and want to seed a specific city, type it here (e.g. <em>Davenport</em> or <em>33837</em>). You can also filter by <strong>Property Type</strong>, <strong>Max Price</strong>, and <strong>Min Beds</strong>.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">3</div>
                                        <div>
                                            <strong className="text-slate-900 block mb-1">Amount & Pagination (Advanced Data Gathering)</strong>
                                            <p className="text-sm text-slate-600">Choose how many to download in this burst (e.g., <strong>20 Properties</strong>). <br/><span className="text-indigo-600 font-medium font-italic">Pro-Tip for Offset (Skip):</span> If you already downloaded the first 20 properties in Orlando, type <code>20</code> in the Offset box to skip those and download properties 21-40!</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">4</div>
                                        <div>
                                            <strong className="text-slate-900 block mb-1">Start Import</strong>
                                            <p className="text-sm text-slate-600">Click the button. The server connects to the Bridge API, securely downloads the properties, injects them into Firestore, and creates the 3,000-dimensional AI Vector brain links. When the loading bar finishes, the houses are live on your front page.</p>
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-8">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
                        <Award size={20} className="text-blue-500" /> Powered by Antigravity Agentic OS
                    </div>
                </div>

            </div>
        </main>
    );
}
