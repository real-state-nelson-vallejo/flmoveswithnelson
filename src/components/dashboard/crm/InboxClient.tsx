"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationDTO as Conversation } from "@/types/conversation";
import { LeadDTO } from '@/types/lead';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { LeadSidebar } from './LeadSidebar';
import { getLeadByIdAction } from '@/actions/crm/actions';
import { seedCrmDataAction } from '@/actions/crm/seed';
import { PlusCircle, Bot, ChevronRight, ChevronLeft, ArrowLeft, User } from 'lucide-react';

interface InboxClientProps {
    initialConversations: Conversation[];
}

type MobileView = 'list' | 'chat' | 'profile';

// Animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
};

export function InboxClient({ initialConversations }: InboxClientProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [conversations, _setConversations] = useState(initialConversations);
    const [activeLead, setActiveLead] = useState<LeadDTO | undefined>(undefined);
    const [showSidebar, setShowSidebar] = useState(true);
    const [leadsMap, setLeadsMap] = useState<Record<string, LeadDTO>>({});
    const [mobileView, setMobileView] = useState<MobileView>('list');
    const [direction, setDirection] = useState(0);

    // Derived state for selected conversation
    const selectedConversation = conversations.find(c => c.id === selectedId);

    // Load all leads for conversations on mount
    useEffect(() => {
        const loadAllLeads = async () => {
            const leadIds = new Set<string>();

            conversations.forEach(conv => {
                const leadId = conv.participants?.[0];
                if (leadId && typeof leadId === 'string' && leadId !== 'system-ai') {
                    leadIds.add(leadId);
                }
            });

            const leadsData: Record<string, LeadDTO> = {};
            await Promise.all(
                Array.from(leadIds).map(async (leadId) => {
                    try {
                        const result = await getLeadByIdAction(leadId);
                        if (result.success && result.data) {
                            leadsData[leadId] = result.data;
                        }
                    } catch (error) {
                        console.error(`Error fetching lead ${leadId}:`, error);
                    }
                })
            );

            setLeadsMap(leadsData);
        };

        loadAllLeads();
    }, [conversations]);

    // Fetch lead data when conversation changes
    useEffect(() => {
        const fetchLead = async () => {
            if (!selectedConversation) {
                setActiveLead(undefined);
                return;
            }

            const leadIdRaw = selectedConversation.participants?.[0]
                || selectedConversation.metadata?.leadId;

            const leadId = typeof leadIdRaw === 'string' ? leadIdRaw : undefined;

            if (!leadId || leadId === 'system-ai') {
                setActiveLead(undefined);
                return;
            }

            if (leadsMap[leadId]) {
                setActiveLead(leadsMap[leadId]);
                return;
            }

            try {
                const result = await getLeadByIdAction(leadId);
                if (result.success && result.data) {
                    setActiveLead(result.data);
                    setLeadsMap(prev => ({ ...prev, [leadId]: result.data }));
                } else {
                    console.warn('Lead not found:', leadId);
                    setActiveLead(undefined);
                }
            } catch (error) {
                console.error('Error fetching lead:', error);
                setActiveLead(undefined);
            }
        };

        fetchLead();
    }, [selectedConversation, leadsMap]);

    const handleSimulate = async () => {
        await seedCrmDataAction();
        window.location.reload();
    };

    const handleAutoReply = async () => {
        if (!selectedId) return;
        try {
            const response = await fetch('/api/ai/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedId,
                    userInput: 'Please provide an appropriate response based on our conversation.'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate AI reply');
            }

            window.location.reload();
        } catch (e) {
            console.error('Auto-reply error:', e);
            alert('Failed to generate AI response. Please try again.');
        }
    };

    const handleSelectConversation = (id: string) => {
        setSelectedId(id);
        setDirection(1);
        setMobileView('chat');
    };

    const handleBackToList = () => {
        setDirection(-1);
        setMobileView('list');
    };

    const handleShowProfile = () => {
        setDirection(1);
        setMobileView('profile');
    };

    const handleBackToChat = () => {
        setDirection(-1);
        setMobileView('chat');
    };

    return (
        <div className="flex h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden shadow-lg border border-slate-200 relative">
            {/* LAYER 1: Sidebar List */}
            <AnimatePresence mode="wait">
                {(mobileView === 'list' || window.innerWidth >= 768) && (
                    <motion.div
                        key="list"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className={`
                            w-full md:w-1/3 lg:w-1/4 xl:max-w-[350px] 
                            border-r border-slate-200 flex flex-col bg-white
                            md:relative absolute inset-0 z-10
                        `}
                    >
                        <div className="h-16 px-4 border-b border-slate-200 bg-white flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800 text-base">Messages</h2>
                            <div className="flex gap-2 items-center">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAutoReply}
                                    disabled={!selectedId}
                                    className="p-1.5 rounded-lg transition-all text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Generate AI Reply"
                                >
                                    <Bot size={16} />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSimulate}
                                    className="p-1.5 rounded-lg transition-all text-blue-600 hover:bg-blue-50"
                                    title="Simulate incoming message"
                                >
                                    <PlusCircle size={16} />
                                </motion.button>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-white border-b">
                            <input
                                type="text"
                                placeholder="🔍 Search conversations..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <ConversationList
                                conversations={conversations}
                                selectedId={selectedId}
                                onSelect={handleSelectConversation}
                                leadsMap={leadsMap}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LAYER 2: Chat Area */}
            <AnimatePresence mode="wait">
                {(mobileView === 'chat' || window.innerWidth >= 768) && (
                    <motion.div
                        key="chat"
                        custom={direction}
                        variants={slideVariants}
                        initial={mobileView === 'chat' ? "enter" : false}
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className={`
                            flex-1 flex flex-col bg-white min-w-0 relative
                            md:relative absolute inset-0 z-20
                        `}
                    >
                        {selectedId && selectedConversation ? (
                            <>
                                {/* Mobile: Back button + Lead name header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="md:hidden h-16 px-4 bg-white border-b border-slate-200 flex items-center gap-3"
                                >
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleBackToList}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft size={20} className="text-slate-700" />
                                    </motion.button>
                                    <div className="flex-1 flex items-center gap-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0"
                                        >
                                            {activeLead?.name?.charAt(0).toUpperCase() || 'U'}
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 truncate">
                                                {activeLead?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate">
                                                {activeLead?.email || 'No email'}
                                            </p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleShowProfile}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="View Profile"
                                    >
                                        <User size={20} className="text-slate-600" />
                                    </motion.button>
                                </motion.div>

                                <ChatWindow
                                    conversation={selectedConversation}
                                    currentUser="admin"
                                />

                                {/* Desktop: Toggle Sidebar Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="hidden md:block absolute top-4 right-4 z-10 p-2 bg-white border border-slate-300 rounded-lg shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-200"
                                    title={showSidebar ? "Hide Lead Profile" : "Show Lead Profile"}
                                >
                                    <motion.div
                                        animate={{ rotate: showSidebar ? 0 : 180 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {showSidebar ? (
                                            <ChevronRight size={20} className="text-slate-600" />
                                        ) : (
                                            <ChevronLeft size={20} className="text-slate-600" />
                                        )}
                                    </motion.div>
                                </motion.button>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white"
                            >
                                <div className="text-center space-y-4 p-8">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1
                                        }}
                                        className="text-6xl"
                                    >
                                        💬
                                    </motion.div>
                                    <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
                                    <p className="text-sm text-slate-500 max-w-md">
                                        Choose a conversation from the left to view messages and start chatting
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LAYER 3: Lead Sidebar */}
            <AnimatePresence mode="wait">
                {(mobileView === 'profile' || (selectedId && showSidebar && window.innerWidth >= 768)) && (
                    <motion.div
                        key="profile"
                        custom={direction}
                        variants={slideVariants}
                        initial={mobileView === 'profile' ? "enter" : false}
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className={`
                            border-l border-slate-200 bg-white
                            md:w-80 lg:w-96 flex flex-col
                            md:relative absolute inset-0 z-30
                        `}
                    >
                        {/* Mobile: Back button header */}
                        {mobileView === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="md:hidden h-16 px-4 bg-white border-b border-slate-200 flex items-center gap-3"
                            >
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleBackToChat}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-slate-700" />
                                </motion.button>
                                <h3 className="font-semibold text-slate-800">Lead Profile</h3>
                            </motion.div>
                        )}

                        {selectedId && (
                            <LeadSidebar
                                lead={activeLead}
                                onClose={() => {
                                    setShowSidebar(false);
                                    if (mobileView === 'profile') {
                                        handleBackToChat();
                                    }
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
