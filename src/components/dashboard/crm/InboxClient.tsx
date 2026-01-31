"use client";

import { useState } from 'react';
import { Conversation } from '@/backend/crm/domain/Conversation';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { LeadSidebar } from './LeadSidebar';
import { generateAIReplyAction, getAvailableModelsAction } from '@/actions/crm/actions';
import { seedCrmDataAction } from '@/actions/crm/seed';
import { PlusCircle, Bot } from 'lucide-react';
import { useEffect } from 'react';

interface InboxClientProps {
    initialConversations: Conversation[];
    userId: string;
}

export function InboxClient({ initialConversations, userId }: InboxClientProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [conversations, _setConversations] = useState(initialConversations);
    const [models, setModels] = useState<{ id: string, name: string }[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');

    useEffect(() => {
        getAvailableModelsAction().then(res => {
            if (res.success && res.models && res.models.length > 0) {
                console.log("Loaded models:", res.models);
                setModels(res.models);

                // Auto-select logic
                const preferred = res.models.find((m: { id: string }) => m.id.includes('2.5-flash'))?.id
                    || res.models.find((m: { id: string }) => m.id.includes('2.0-flash'))?.id
                    || res.models.find((m: { id: string }) => m.id.includes('1.5-flash'))?.id
                    || res.models[0].id;

                setSelectedModel(preferred);
            } else {
                console.error("No models loaded or empty list", res);
            }
        });
    }, []);

    // Derived state for selected conversation
    const selectedConversation = conversations.find(c => c.id === selectedId);

    const handleSimulate = async () => {
        await seedCrmDataAction();
        // Ideally re-fetch or rely on router refresh. 
        // For this mock, we might need to manually trigger a refresh if standard revalidatePath doesn't hit client component state instantly without router.refresh()
        // But let's rely on parent passing new props or router refresh if we were using it.
        // Since we passed initialConversations, we might need to trigger a router refresh here.
        window.location.reload(); // Simple brute force for the mock demo
    };

    const handleAutoReply = async () => {
        if (!selectedId) return;
        try {
            await generateAIReplyAction(selectedId, selectedModel);
            // Refresh to see message
            // ideally we'd optimistic upate the chat window here too, but for MVP reload/re-fetch
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
    };

    const [showSidebar, setShowSidebar] = useState(true);

    // Mock resolving lead from conversation metadata (In real app, fetch Lead by ID)
    // Mock resolving lead from conversation metadata (In real app, fetch Lead by ID)
    const activeLead = selectedConversation?.metadata?.leadId ? {
        id: selectedConversation.metadata.leadId,
        name: selectedConversation.metadata.leadName || "Unknown",
        email: "contact@example.com", // Placeholder
        status: "new" as const, // Explicit literal type
        source: "Web Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    } : undefined;

    return (
        <div className="flex h-full bg-white border rounded-lg overflow-hidden shadow-sm">
            {/* Sidebar List */}
            <div className="w-1/3 border-r flex flex-col min-w-[300px]">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Messages</h2>
                    <div className="flex gap-2 items-center">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 max-w-[100px]"
                        >
                            {models.length === 0 && <option value="gemini-1.5-flash">Default</option>}
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.id}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAutoReply}
                            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800"
                            title="Generate AI Reply"
                        >
                            <Bot size={14} />
                        </button>
                        <button
                            onClick={handleSimulate}
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            title="Simulate incoming message"
                        >
                            <PlusCircle size={14} />
                        </button>
                    </div>
                </div>
                <div className="px-4 pb-2 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        conversations={conversations}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 min-w-[400px]">
                {selectedId && selectedConversation ? (
                    <ChatWindow
                        conversation={selectedConversation}
                        currentUser={userId}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>

            {/* Lead Sidebar (Right) */}
            {selectedId && showSidebar && (
                <LeadSidebar
                    lead={activeLead}
                    onClose={() => setShowSidebar(false)}
                />
            )}
        </div>
    );
}
