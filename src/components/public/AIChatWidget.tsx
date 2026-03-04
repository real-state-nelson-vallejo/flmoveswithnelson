"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { MessageDTO as Message } from "@/types/conversation";
import { motion, AnimatePresence } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";
import { sendVerificationCodeAction, verifyOtpAction } from "@/actions/crm/verificationActions";
import { startConversationAction, generateAIReplyAction } from "@/actions/crm/actions";
import { signInWithCustomToken } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, Unsubscribe, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { ChatMessage } from "@/components/ai/chat/ChatMessage";

const COUNTRY_CODES = [
    { code: "+1", label: "🇺🇸 +1", country: "USA/Canada" },
    { code: "+34", label: "🇪🇸 +34", country: "Spain" },
    { code: "+57", label: "🇨🇴 +57", country: "Colombia" },
    { code: "+52", label: "🇲🇽 +52", country: "Mexico" },
    { code: "+44", label: "🇬🇧 +44", country: "UK" },
    { code: "+33", label: "🇫🇷 +33", country: "France" },
    { code: "+49", label: "🇩🇪 +49", country: "Germany" },
];

export function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'cta' | 'chat' | 'gate'>('cta');

    // Auth State
    const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
    const [countryCode, setCountryCode] = useState('+1');
    const [isVerificationSent, setIsVerificationSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Custom Event Listener for global CTAs
    useEffect(() => {
        const handleOpenChat = (e: Event) => {
            const customEvent = e as CustomEvent<{ message?: string }>;
            setIsOpen(true);

            // If the chat is closed or we're at the very beginning and a message was passed
            if (customEvent.detail?.message && step === 'cta') {
                setInputValue(customEvent.detail.message);
            }
        };

        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, [step]);

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping, step]);

    // Real-time message subscription
    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('createdAt', 'asc'));

        const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                ...doc.data() as Message,
                id: doc.id
            }));
            setMessages(msgs);

            // Only stop typing if the last message is likely the AI response (or system)
            // If the last message is from 'user', we keep typing active as we wait for reply.
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.senderRole !== 'user') {
                setIsTyping(false);
            }
        }, (error) => {
            console.error("[Widget] Realtime message error:", error);
        });

        return () => unsubscribe();
    }, [conversationId]);

    // Re-writing handleSend fully correctly
    const onSendMessage = async () => {
        if (!inputValue.trim()) return;
        const txt = inputValue;
        setInputValue("");

        const tempMsg: Message = {
            id: crypto.randomUUID(),
            conversationId: conversationId || 'temp',
            senderId: leadId || 'guest',
            senderRole: 'user',
            content: txt,
            type: 'text',
            createdAt: Date.now(),
            readBy: []
        };
        setMessages(prev => [...prev, tempMsg]);
        setIsTyping(true); // Start typing immediately

        if (!conversationId) {
            setStep('gate');
            return;
        }

        // Reuse the generic action
        const { sendMessageAction } = await import("@/actions/crm/actions");
        await sendMessageAction({
            conversationId,
            senderId: leadId || 'guest',
            senderRole: 'user',
            content: txt,
            type: 'text'
        });

        try {
            await generateAIReplyAction(conversationId);
        } catch (error) {
            console.error("[Widget] Failed to generate AI reply (likely timeout):", error);
            // Optionally set typing to false or show an error toast, 
            // but the server might still be working. 
            // Better to just catch it so the UI doesn't break.
            setIsTyping(false);
        }
    };

    const handleGateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactInfo.name || !contactInfo.email || !contactInfo.phone || !captchaToken) return;

        setIsSendingVerification(true);
        const fullPhone = `${countryCode} ${contactInfo.phone}`;
        const res = await sendVerificationCodeAction(
            { name: contactInfo.name, email: contactInfo.email, phone: fullPhone, channel: otpChannel },
            captchaToken
        );
        setIsSendingVerification(false);

        if (res.success) {
            setIsVerificationSent(true);
        } else {
            alert("Error sending verification code: " + res.error);
        }
    };

    const handleVerifyOtp = async () => {
        setIsSendingVerification(true);
        const res = await verifyOtpAction(contactInfo.email, otpCode);

        if (!res.success || !res.token || !res.leadId) {
            setIsSendingVerification(false);
            alert("Invalid code: " + res.error);
            return;
        }

        try {
            // Sign in with the Custom Token from backend
            await signInWithCustomToken(auth, res.token);
            console.log("[Widget] ✅ Signed in with custom token for lead:", res.leadId);

            if (res.existingConversationId) {
                console.log('[Widget] Resuming conversation:', res.existingConversationId);
                setConversationId(res.existingConversationId);
                setLeadId(res.leadId);
                setStep('chat');
                setOtpCode('');
                localStorage.setItem('nelson_lead_id', res.leadId);
                setIsSendingVerification(false);
            } else {
                // Start new — pass the verified leadId
                setLeadId(res.leadId);
                startChatSession(res.leadId);
            }
        } catch (authError) {
            console.error("[Widget] Firebase auth error:", authError);
            alert("Authentication failed. Please try again.");
            setIsSendingVerification(false);
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
            try {
                await generateAIReplyAction(convoRes.conversationId);
            } catch (error) {
                console.error("[Widget] Failed to generate initial AI reply:", error);
                setIsTyping(false);
            }
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
                            className="bg-black text-white shadow-2xl rounded-full px-6 py-4 flex items-center gap-4 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all w-full max-w-md pointer-events-auto border border-zinc-800"
                        >
                            <div className="rounded-full w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden bg-zinc-800">
                                <img src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2FJessica%20Asistente.png?alt=media&token=35a784bd-6f2d-4925-9bb7-2218fe6f7156" alt="Jessica AI" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-sm tracking-wide text-zinc-100 uppercase">Jesika AI Assistant</p>
                                <p className="text-xs text-zinc-400 tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>How can I help you today?</p>
                            </div>
                            <ChevronDown size={20} className="rotate-180 text-zinc-500 shrink-0" />
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
                            <div className="bg-black p-5 flex justify-between items-center text-white shrink-0 shadow-md z-10 border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full flex items-center justify-center w-10 h-10 shrink-0 overflow-hidden bg-zinc-800">
                                        <img src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2FJessica%20Asistente.png?alt=media&token=35a784bd-6f2d-4925-9bb7-2218fe6f7156" alt="Jessica AI" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg tracking-wide uppercase text-zinc-100">Jesika AI</h3>
                                        <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <p className="text-xs font-light text-zinc-400 uppercase tracking-widest">Online</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
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
                                        <h2 className="text-2xl font-light text-slate-800 tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>Hello, I'm Jesika.<br />How can I assist you?</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 px-4">
                                            <button onClick={() => setInputValue("I am looking to sell my house")} className="bg-white p-3.5 rounded shadow-sm border border-slate-200 hover:border-slate-800 hover:shadow-md text-left transition-all group flex flex-col justify-center items-center">
                                                <span className="font-medium tracking-wide">Looking to Sell</span>
                                                <span className="text-xs text-slate-400 mt-1">Get an estimate</span>
                                            </button>
                                            <button onClick={() => setInputValue("I am looking to rent")} className="bg-white p-3.5 rounded shadow-sm border border-slate-200 hover:border-slate-800 hover:shadow-md text-left transition-all group flex flex-col justify-center items-center">
                                                <span className="font-medium tracking-wide">Looking to Rent</span>
                                                <span className="text-xs text-slate-400 mt-1">Find a lease</span>
                                            </button>
                                            <button onClick={() => setInputValue("I am looking for a house to buy")} className="bg-white p-3.5 rounded shadow-sm border border-slate-200 hover:border-slate-800 hover:shadow-md text-left transition-all group flex flex-col justify-center items-center">
                                                <span className="font-medium tracking-wide">Looking to Buy</span>
                                                <span className="text-xs text-slate-400 mt-1">Found your dream home</span>
                                            </button>
                                            <button onClick={() => setInputValue("I am looking to invest")} className="bg-white p-3.5 rounded shadow-sm border border-slate-200 hover:border-slate-800 hover:shadow-md text-left transition-all group flex flex-col justify-center items-center">
                                                <span className="font-medium tracking-wide">Looking to Invest</span>
                                                <span className="text-xs text-slate-400 mt-1">Explore opportunities</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {messages.map(msg => {
                                    // Robust type handling for ChatMessage
                                    const isUser = msg.senderRole === 'user';
                                    const role: 'user' | 'model' = isUser ? 'user' : 'model';

                                    // Safe metadata access with type assertion for toolOutput
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const toolOutput = (msg.metadata as any)?.toolOutput;

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className="w-full flex flex-col gap-2"
                                        >
                                            {/* 1. Render Text Content */}
                                            <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={isUser ? 'max-w-[85%]' : 'w-full'}>
                                                    <ChatMessage
                                                        message={{
                                                            role,
                                                            content: msg.content
                                                        }}
                                                        locale="en"
                                                    />
                                                </div>
                                            </div>

                                            {/* 2. Render Tool Output (if any) from Metadata */}
                                            {!isUser && toolOutput && (
                                                <div className="w-full flex justify-start">
                                                    <div className="w-full">
                                                        <ChatMessage
                                                            message={{
                                                                role: 'tool',
                                                                toolType: toolOutput.type,
                                                                toolData: toolOutput
                                                            }}
                                                            locale="en"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}

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

                                            {/* Phone with Country Code */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Phone Number</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={countryCode}
                                                        onChange={e => {
                                                            const newCode = e.target.value;
                                                            setCountryCode(newCode);
                                                            if (newCode !== '+1' && otpChannel === 'sms') {
                                                                setOtpChannel('email');
                                                            }
                                                        }}
                                                        disabled={isVerificationSent}
                                                    >
                                                        {COUNTRY_CODES.map(c => (
                                                            <option key={c.code} value={c.code}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="tel"
                                                        required
                                                        placeholder="(555) 000-0000"
                                                        className="flex-1 text-base p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all disabled:bg-slate-100"
                                                        value={contactInfo.phone}
                                                        onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                                        disabled={isVerificationSent}
                                                    />
                                                </div>
                                            </div>

                                            {/* Channel Selector */}
                                            <div className="pt-2">
                                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-2">How should we send the code?</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOtpChannel('email')}
                                                        className={`flex-1 p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${otpChannel === 'email' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                    >
                                                        Email
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOtpChannel('sms')}
                                                        disabled={countryCode !== '+1'}
                                                        className={`flex-1 p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${otpChannel === 'sms' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400'}`}
                                                        title={countryCode !== '+1' ? "SMS verification is only available in US/Canada" : ""}
                                                    >
                                                        SMS
                                                    </button>
                                                </div>
                                                {countryCode !== '+1' && (
                                                    <p className="text-[10px] text-amber-600 mt-1.5 ml-1">
                                                        * SMS verification is currently only available for US/Canada numbers.
                                                    </p>
                                                )}
                                            </div>

                                            {!isVerificationSent ? (
                                                <>
                                                    <div className="flex justify-center py-2 min-h-[78px]">
                                                        <ReCAPTCHA
                                                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                                            onChange={setCaptchaToken}
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={!captchaToken || isSendingVerification}
                                                        className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isSendingVerification ? "Sending Code..." : "Send Verification Code"}
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
                                                            Code sent to <b>{otpChannel === 'email' ? contactInfo.email : contactInfo.phone}</b>.
                                                            <br />Check your {otpChannel === 'email' ? 'inbox or spam folder' : 'messages'}.
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
                                                        disabled={otpCode.length < 6 || isSendingVerification}
                                                        className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isSendingVerification ? "Verifying..." : "Verify & Chat"}
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
                                            onKeyDown={e => e.key === 'Enter' && onSendMessage()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={onSendMessage}
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
