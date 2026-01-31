import { Suspense } from 'react';
import { InboxClient } from '@/components/dashboard/crm/InboxClient';
import { getConversationsAction } from '@/actions/crm/actions';

// Mock user ID for now - In real app, get from session
const MOCK_USER_ID = "agent-123";

export default async function InboxPage() {
    // Fetch initial data on server
    const { data: conversations } = await getConversationsAction(MOCK_USER_ID);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <InboxClient initialConversations={conversations || []} userId={MOCK_USER_ID} />
        </div>
    );
}
