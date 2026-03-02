import { getAgentConfig } from "@/actions/ai/actions";
import { AgentConfigForm } from "@/components/ai/AgentConfigForm";

export default async function AIAgentPage() {
    const config = await getAgentConfig();

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Virtual Assistant</h1>
                <p className="text-muted-foreground">
                    Configure personality, tools, and behavior for your AI agent.
                </p>
            </div>

            <div>
                <AgentConfigForm initialConfig={config} />
            </div>
        </div>
    );
}
