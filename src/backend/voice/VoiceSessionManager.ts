/**
 * VoiceSessionManager
 * In-memory session store for voice calls.
 * Each active call (identified by CallSid) maintains its own conversation history.
 */

interface VoiceSession {
    callSid: string;
    callerPhone: string;
    leadId?: string;
    conversationId?: string;
    language: string;
    history: Array<{ role: string; content: string }>;
    createdAt: Date;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

class VoiceSessionStore {
    private sessions = new Map<string, VoiceSession>();

    /**
     * Get or create a session for a given CallSid
     */
    getOrCreate(callSid: string, callerPhone: string, leadId?: string): VoiceSession {
        let session = this.sessions.get(callSid);
        if (!session) {
            session = {
                callSid,
                callerPhone,
                ...(leadId ? { leadId } : {}),
                language: 'en-US', // Default
                history: [],
                createdAt: new Date(),
            };
            this.sessions.set(callSid, session);
            console.log(`[VoiceSession] Created session for call ${callSid}`);
        } else if (leadId && !session.leadId) {
            // Update an existing session with the lead ID if it wasn't available at creation
            session.leadId = leadId;
        }
        return session;
    }

    /**
     * Set language for the session
     */
    setLanguage(callSid: string, language: string): void {
        const session = this.sessions.get(callSid);
        if (session) {
            session.language = language;
            console.log(`[VoiceSession] Language set to ${language} for call ${callSid}`);
        }
    }

    /**
     * Set the conversation document ID for the session
     */
    setConversationId(callSid: string, conversationId: string): void {
        const session = this.sessions.get(callSid);
        if (session) {
            session.conversationId = conversationId;
        }
    }

    /**
     * Add a message to the session history
     */
    addMessage(callSid: string, role: 'user' | 'model', content: string): void {
        const session = this.sessions.get(callSid);
        if (session) {
            session.history.push({ role, content });
        }
    }

    /**
     * Get formatted history for the agent (Genkit format)
     */
    getHistory(callSid: string): Array<{ role: string; content: string }> {
        const session = this.sessions.get(callSid);
        return session ? session.history : [];
    }

    /**
     * Get session
     */
    get(callSid: string): VoiceSession | undefined {
        return this.sessions.get(callSid);
    }

    /**
     * Remove a session (call ended)
     */
    remove(callSid: string): void {
        this.sessions.delete(callSid);
        console.log(`[VoiceSession] Removed session for call ${callSid}`);
    }

    /**
     * Cleanup stale sessions
     */
    cleanup(): void {
        const now = Date.now();
        for (const [callSid, session] of this.sessions) {
            if (now - session.createdAt.getTime() > SESSION_TTL_MS) {
                this.sessions.delete(callSid);
                console.log(`[VoiceSession] Cleaned up stale session ${callSid}`);
            }
        }
    }
}

// Singleton (survives HMR in dev), version bumped to clear cache
const STORE_KEY = '__voiceSessionStore_v2';
export const voiceSessionManager: VoiceSessionStore =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[STORE_KEY] || new VoiceSessionStore();

if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[STORE_KEY] = voiceSessionManager;
}

// Cleanup stale sessions every 10 minutes
setInterval(() => voiceSessionManager.cleanup(), 10 * 60 * 1000);
