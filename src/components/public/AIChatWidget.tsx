"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { Message } from '@/backend/crm/domain/Conversation';
import { motion, AnimatePresence } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";
import { sendVerificationEmailAction, verifyOtpAction } from "@/actions/crm/verificationActions";
import { startConversationAction, generateAIReplyAction } from "@/actions/crm/actions";
import { signInWithCustomToken } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'cta' | 'chat' | 'gate'>('cta');

    // Auth State
    const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
    const [isVerificationSent, setIsVerificationSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    // const [leadId, setLeadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping, step]);

    // Real-time message subscription
    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                ...doc.data() as Message,
                id: doc.id
            }));
            setMessages(msgs);
            setIsTyping(false); // Stop typing indicator when new messages arrive
        }, (error) => {
            console.error("[Widget] Realtime message error:", error);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue("");

        // Optimistic update
        const tempMsg: Message = {
            id: crypto.randomUUID(),
            conversationId: conversationId || 'temp',
            senderId: 'guest',
            senderRole: 'user',
            content: userText,
            type: 'text',
            createdAt: Date.now(),
            readBy: []
        };

        setMessages(prev => [...prev, tempMsg]);

        if (!conversationId) {
            setStep('gate');
            return;
        }

        setIsTyping(true);
        // ... (API logic would go here in full implementation)
    };

    const handleGateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactInfo.name || !contactInfo.email || !captchaToken) return;

        setIsTyping(true);
        const res = await sendVerificationEmailAction(
            { name: contactInfo.name, email: contactInfo.email },
            captchaToken
        );
        setIsTyping(false);

        if (res.success) {
            setIsVerificationSent(true);
        } else {
            alert("Error sending verification code: " + res.error);
        }
    };

    const handleVerifyOtp = async () => {
        setIsTyping(true);
        const res = await verifyOtpAction(contactInfo.email, otpCode);

        if (!res.success || !res.token || !res.leadId) {
            setIsTyping(false);
            alert("Invalid code: " + res.error);
            return;
        }

        try {
            // Sign in with the Custom Token from backend
            await signInWithCustomToken(auth, res.token);
            console.log("[Widget] ✅ Signed in with custom token for lead:", res.leadId);

            // Start chat session with leadId
            startChatSession(res.leadId);
        } catch (authError) {
            console.error("[Widget] Firebase auth error:", authError);
            alert("Authentication failed. Please try again.");
            setIsTyping(false);
        }
    };

    const startChatSession = async (incomingLeadId: string) => {
        const initialMsg = messages[0]?.content || "Hello";

        // Start conversation with participants: [leadId, 'system-ai']
        const convoRes = await startConversationAction(
            [incomingLeadId, 'system-ai'],
            initialMsg,
            { leadId: incomingLeadId, source: 'public_chat' }
        );

        if (convoRes.success && convoRes.conversationId) {
            setConversationId(convoRes.conversationId);
            // setLeadId(incomingLeadId);
            setStep('chat');
            setIsTyping(true); // AI is "thinking"
            setOtpCode('');

            // Trigger AI Reply - onSnapshot will auto-fetch messages in real-time
            await generateAIReplyAction(convoRes.conversationId);
            // Note: isTyping will be set to false by onSnapshot when messages arrive
        } else {
            alert("Failed to start chat session");
            setIsTyping(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-6 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
                    >
                        <button
                            onClick={() => setIsOpen(true)}
                            className="bg-slate-900 text-white shadow-2xl rounded-full px-6 py-4 flex items-center gap-4 hover:scale-105 transition-transform w-full max-w-md pointer-events-auto border border-slate-700"
                        >
                            <div className="bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full p-2 shadow-inner">
                                <Bot size={24} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-base">Virtual Assistant</p>
                                <p className="text-xs text-slate-300">Looking for a property? Ask me.</p>
                            </div>
                            <ChevronDown size={20} className="rotate-180 text-slate-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm sm:p-4"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[85vh] h-full sm:h-auto border border-slate-200"
                        >
                            {/* Header */}
                            <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0 shadow-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full p-2">
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Nelson AI</h3>
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            <p className="text-xs font-medium">Online</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6" ref={scrollRef}>
                                {messages.length === 0 && step !== 'gate' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-10 space-y-6"
                                    >
                                        <h2 className="text-2xl font-bold text-slate-800">Hello.<br />What&apos;s on your mind?</h2>
                                        <div className="grid gap-3 text-sm text-slate-600 px-4">
                                            <button onClick={() => setInputValue("Looking for an apartment downtown")} className="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-500 hover:shadow-md text-left transition-all group">
                                                <span className="text-xl mr-2 group-hover:scale-110 inline-block transition-transform">🏢</span>
                                                Looking for an apartment downtown
                                            </button>
                                            <button onClick={() => setInputValue("I want to sell my house")} className="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-500 hover:shadow-md text-left transition-all group">
                                                <span className="text-xl mr-2 group-hover:scale-110 inline-block transition-transform">💰</span>
                                                I want to sell my house
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {messages.map(msg => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id}
                                        className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.senderRole === 'user'
                                            ? 'bg-slate-900 text-white rounded-br-sm'
                                            : 'bg-white border text-slate-700 rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-white border shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5 items-center h-10 w-16 justify-center">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'gate' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="bg-white border rounded-xl p-5 shadow-lg space-y-4 border-blue-100"
                                    >
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">Identity Verification</h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                To ensure a secure experience, please verify your identity with OTP.
                                                We will send a code to your email.
                                            </p>
                                        </div>
                                        <form onSubmit={handleGateSubmit} className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Your Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="John Doe"
                                                    className="w-full text-base p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all disabled:bg-slate-100"
                                                    value={contactInfo.name}
                                                    onChange={e => setContactInfo({ ...contactInfo, name: e.target.value })}
                                                    disabled={isVerificationSent}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="name@example.com"
                                                    className="w-full text-base p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all disabled:bg-slate-100"
                                                    value={contactInfo.email}
                                                    onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                                    disabled={isVerificationSent}
                                                />
                                            </div>

                                            {!isVerificationSent ? (
                                                <>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Phone (Optional)</label>
                                                        <input
                                                            type="tel"
                                                            placeholder="+1 (555) 000-0000"
                                                            className="w-full text-base p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                                            value={contactInfo.phone}
                                                            onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex justify-center py-2 min-h-[78px]">
                                                        <ReCAPTCHA
                                                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                                            onChange={setCaptchaToken}
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={!captchaToken || isTyping}
                                                        className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isTyping ? "Sending Code..." : "Send Verification Code"}
                                                    </button>
                                                </>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="space-y-4 pt-2"
                                                >
                                                    <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-lg border border-blue-100 flex items-start gap-2 leading-relaxed">
                                                        <span className="text-lg">📩</span>
                                                        <p>
                                                            Code sent to <b>{contactInfo.email}</b>.
                                                            <br />Check your inbox or spam folder.
                                                            <span className="opacity-50 block mt-1">(Dev Check Console)</span>
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Enter Code</label>
                                                        <input
                                                            type="text"
                                                            placeholder="000 000"
                                                            className="w-full text-center text-3xl tracking-[0.5em] p-3 bg-white border-2 border-slate-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono font-bold text-slate-800 uppercase"
                                                            value={otpCode}
                                                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                            maxLength={6}
                                                            autoFocus
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyOtp}
                                                        disabled={otpCode.length < 6 || isTyping}
                                                        className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isTyping ? "Verifying..." : "Verify & Chat"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsVerificationSent(false); setOtpCode(''); }}
                                                        className="w-full text-slate-400 text-xs hover:text-slate-600 py-2 hover:underline transition-colors"
                                                    >
                                                        Entered wrong email? Change it
                                                    </button>
                                                </motion.div>
                                            )}
                                        </form>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer Input */}
                            {step !== 'gate' && (
                                <div className="p-4 bg-white border-t shrink-0">
                                    <div className="relative flex items-center">
                                        <input
                                            className="w-full bg-slate-100 rounded-full pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                            placeholder="Type a message..."
                                            value={inputValue}
                                            onChange={e => setInputValue(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!inputValue.trim()}
                                            className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                                        Powered by Gemini 2.5 Flash AI
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
