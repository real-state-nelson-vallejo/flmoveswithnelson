import { Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function AnalysisMethodology({ children }: { children?: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children ?? (
                    <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                        <Info size={14} />
                        <span>How is this calculated?</span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        🤖 AI Analysis Methodology
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Understanding how our AI models generate investment insights.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                        <h4 className="font-semibold text-foreground mb-2 text-sm">Automated Valuation Model (AVM)</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Currently, this analysis uses a <strong>Generative Heuristic Model</strong>.
                            Our AI analyzes the property's location, specifications, and listing details against its internal database of market trends to <em>infer</em> likely financial performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg bg-card">
                            <h5 className="font-bold text-foreground text-sm mb-1">Opportunity Score</h5>
                            <p className="text-xs text-muted-foreground">
                                A proprietary 0-100 score weighing <strong>Price vs. Market Value</strong>, location growth potential, and estimated rental demand.
                            </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg bg-card">
                            <h5 className="font-bold text-foreground text-sm mb-1">Cap Rate (Estimated)</h5>
                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1.5 rounded mt-1 mb-2">
                                (NOI / Purchase Price) × 100
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Estimates Net Operating Income (NOI) based on average market rents and standard expense ratios (approx 40% of rent).
                            </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg bg-card">
                            <h5 className="font-bold text-foreground text-sm mb-1">Cash on Cash ROI</h5>
                            <p className="text-xs text-muted-foreground">
                                Projected annual return on cash invested, assuming a standard 20% down payment and current average mortgage rates.
                            </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg bg-card">
                            <h5 className="font-bold text-foreground text-sm mb-1">Listing Quality</h5>
                            <p className="text-xs text-muted-foreground">
                                Analyzes the completeness of data, quality of description, and visual assets availability to determine listing appeal.
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground italic border-t border-border pt-4">
                        * Note: These figures are estimates for preliminary screening only. Always verify with actual rental comps and contractor bids.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
