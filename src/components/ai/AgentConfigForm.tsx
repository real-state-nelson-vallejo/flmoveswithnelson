'use client';

import { useState } from 'react';
import { AgentTool } from '@/backend/ai/domain/AgentConfiguration';
import { updateAgentConfig, chatWithAgent } from '@/actions/ai/actions';
import { ChatMessage, ChatMessageContent } from './chat/ChatMessage';

interface AgentConfigFormProps {
    initialConfig: {
        systemPrompt: string;
        enabledTools: AgentTool[];
        modelParams: {
            temperature: number;
            modelName: string;
        };
    };
}

export function AgentConfigForm({ initialConfig }: AgentConfigFormProps) {
    const [prompt, setPrompt] = useState(initialConfig.systemPrompt);
    const [tools, setTools] = useState<AgentTool[]>(initialConfig.enabledTools);
    const [temperature, setTemperature] = useState(initialConfig.modelParams.temperature);
    const [modelName, setModelName] = useState(initialConfig.modelParams.modelName);
    const [isSaving, setIsSaving] = useState(false);

    // Playground State
    const [chatHistory, setChatHistory] = useState<ChatMessageContent[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    const availableModels = [
        { value: 'googleai/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fastest)' },
        { value: 'googleai/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Advanced)' },
    ];

    async function handleSave() {
        setIsSaving(true);
        try {
            await updateAgentConfig({
                systemPrompt: prompt,
                enabledTools: tools,
                modelParams: {
                    temperature,
                    modelName
                }
            });
            // Show toast success
            alert('Configuration saved!');
        } catch {
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    }

    function toggleTool(tool: AgentTool) {
        if (tools.includes(tool)) {
            setTools(tools.filter(t => t !== tool));
        } else {
            setTools([...tools, tool]);
        }
    }

    async function handleSendMessage() {
        if (!input.trim()) return;

        const userMessage: ChatMessageContent = { role: 'user', content: input };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        setInput('');
        setIsGenerating(true);
        setDebugLogs([]); // Clear previous logs

        // Pass history for context (convert to simple format for API)
        const simpleHistory = newHistory
            .filter((msg): msg is { role: 'user' | 'model'; content: string } =>
                msg.role === 'user' || msg.role === 'model'
            )
            .map(msg => ({ role: msg.role, content: msg.content }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await chatWithAgent(input, simpleHistory);

        if (result.success && result.data) {
            const responseData = typeof result.data === 'string'
                ? { text: result.data, debugLogs: [], toolOutput: null }
                : result.data;

            // Check if response contains tool output
            let updatedHistory = newHistory;

            if (responseData.toolOutput) {
                // Add tool message
                const toolMessage: ChatMessageContent = {
                    role: 'tool',
                    toolType: responseData.toolOutput.type === 'property_results' ? 'property_results' : 'appointment_confirmation',
                    toolData: responseData.toolOutput
                };
                updatedHistory = [...updatedHistory, toolMessage];
            }

            // Add model response if exists
            if (responseData.text) {
                updatedHistory = [...updatedHistory, { role: 'model', content: responseData.text }];
            }

            setChatHistory(updatedHistory);

            if (responseData.debugLogs && responseData.debugLogs.length > 0) {
                setDebugLogs(responseData.debugLogs);
            }
        } else if (result.error) {
            setChatHistory([...newHistory, { role: 'model', content: `Error: ${result.error}` }]);
        }
        setIsGenerating(false);
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col xl:flex-row gap-8 min-h-[700px] lg:h-[calc(100vh-180px)] p-1">
                {/* Editor Column */}
                <div className="flex-[1.4] flex flex-col gap-6 p-6 md:p-8 border border-border rounded-[2.5rem] bg-card text-card-foreground backdrop-blur-xl shadow-sm overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-50/50 dark:ring-indigo-500/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Agent Persona</h2>
                                <p className="text-sm text-muted-foreground font-medium">Fine-tune behavior and capabilities</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="relative group overflow-hidden bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-sm"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Save Changes
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* System Prompt */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                System Instructions
                            </label>
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Length:</span>
                                <span className="text-xs font-mono font-bold text-primary">{prompt.length.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-muted-foreground">/ 10,000</span>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-300"></div>
                            <textarea
                                className="relative w-full min-h-[320px] p-6 bg-background border border-input rounded-2xl font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground text-foreground"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="You are a sophisticated Real Estate AI Agent..."
                            />
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Model Settings */}
                        <div className="flex flex-col gap-6 p-6 rounded-2xl bg-muted/40 border border-border">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Intelligence Engine</h3>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-foreground">Active Model</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none p-3.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer hover:border-border pr-10 text-foreground"
                                            value={modelName}
                                            onChange={(e) => setModelName(e.target.value)}
                                        >
                                            {availableModels.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 p-4 bg-background border border-border rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-foreground">Temperature</label>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                            {temperature.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="relative pt-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={temperature}
                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between mt-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            <span>Focus</span>
                                            <span>Balanced</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Capabilities */}
                        <div className="flex flex-col gap-4 p-6 rounded-2xl bg-muted/40 border border-border">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Enabled Tools</h3>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => toggleTool('property_search')}
                                    className={`w-full group relative p-4 rounded-xl text-left border-2 transition-all duration-300 ${tools.includes('property_search')
                                        ? 'border-primary bg-background shadow-md'
                                        : 'border-transparent bg-background/50 hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${tools.includes('property_search')
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-bold ${tools.includes('property_search') ? 'text-foreground' : 'text-muted-foreground'}`}>Property Search</h4>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">Inventory Access</p>
                                        </div>
                                        {tools.includes('property_search') && (
                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center animate-in zoom-in duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => toggleTool('agenda')}
                                    className={`w-full group relative p-4 rounded-xl text-left border-2 transition-all duration-300 ${tools.includes('agenda')
                                        ? 'border-primary bg-background shadow-md'
                                        : 'border-transparent bg-background/50 hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${tools.includes('agenda')
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-bold ${tools.includes('agenda') ? 'text-foreground' : 'text-muted-foreground'}`}>Agenda Management</h4>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">Scheduling Tools</p>
                                        </div>
                                        {tools.includes('agenda') && (
                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center animate-in zoom-in duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Playground Column */}
                <div className="flex-1 flex flex-col gap-6 p-8 border border-border rounded-3xl bg-card text-card-foreground shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Test Playground</h2>
                        </div>
                        <button
                            onClick={() => setChatHistory([])}
                            className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:text-foreground transition-colors"
                        >
                            Reset Session
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-muted-foreground font-medium mb-2">Simulate a user query</p>
                                <p className="text-xs text-muted-foreground/80 font-mono">Try: &quot;What are the latest luxury listings?&quot;</p>
                            </div>
                        )}

                        {chatHistory.map((msg, i) => (
                            <ChatMessage key={i} message={msg} locale="en" />
                        ))}

                        {isGenerating && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-muted border border-border rounded-2xl rounded-tl-none p-4 flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        )}

                        {/* Debug Logs Section */}
                        {debugLogs.length > 0 && (
                            <div className="mt-4 border-t border-border pt-2">
                                <button
                                    onClick={() => setShowDebug(!showDebug)}
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 w-full text-left font-mono"
                                >
                                    {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
                                </button>
                                {showDebug && (
                                    <div className="mt-2 text-[10px] font-mono text-green-600 dark:text-green-400 bg-muted/50 p-3 rounded-lg border border-border overflow-x-auto">
                                        {debugLogs.map((log, i) => (
                                            <div key={i} className="mb-1 last:mb-0 border-b border-border/50 last:border-0 pb-1 last:pb-0">
                                                <span className="opacity-50 mr-2">$</span>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative pt-4 border-t border-border">
                        <input
                            className="w-full p-4 pl-6 pr-12 bg-background border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isGenerating || !input.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-30 transition-all group active:scale-90 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
