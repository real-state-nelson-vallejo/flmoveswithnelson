import { InboxClient } from '@/components/dashboard/crm/InboxClient';
import { getConversationsAction } from '@/actions/crm/actions';

export default async function InboxPage() {
    // Fetch all conversations for admin dashboard
    const { data: conversations } = await getConversationsAction();

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <InboxClient initialConversations={conversations || []} />
        </div>
    );
}
