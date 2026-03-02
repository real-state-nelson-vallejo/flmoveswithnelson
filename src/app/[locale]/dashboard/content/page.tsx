"use client";

import { useState, useEffect } from "react";
import { getPostsAction, deletePostAction } from "@/actions/content/actions";
import { PostDTO } from "@/types/content";
import { ContentList } from "@/components/dashboard/ContentList";
import { ContentCalendar } from "@/components/dashboard/ContentCalendar";
import { PostEditor } from "@/components/dashboard/PostEditor";
import { Loader2, Plus, LayoutList, Calendar as CalendarIcon } from "lucide-react";

export default function ContentManagerPage() {
    const [posts, setPosts] = useState<PostDTO[]>([]);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<PostDTO | null | undefined>(undefined); // undefined = list mode, null = new, Post = edit

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        const res = await getPostsAction();
        if (res.success && res.posts) {
            setPosts(res.posts);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        setLoading(true);
        await deletePostAction(id);
        await loadPosts();
    };

    const handleSave = async () => {
        setEditingPost(undefined);
        setLoading(true);
        await loadPosts();
    };

    if (editingPost !== undefined) {
        return (
            <PostEditor
                post={editingPost}
                onSave={handleSave}
                onCancel={() => setEditingPost(undefined)}
            />
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col w-full p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Content Manager</h2>
                    <p className="text-muted-foreground text-sm">Manage blog posts, news, and scheduling.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-secondary p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`p-2 rounded-md transition-all ${view === 'calendar' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <CalendarIcon size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => setEditingPost(null)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        New Post
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {view === 'list' ? (
                    <ContentList
                        posts={posts}
                        onEdit={(post) => setEditingPost(post)}
                        onDelete={handleDelete}
                    />
                ) : (
                    <ContentCalendar posts={posts} />
                )}
            </div>
        </div>
    );
}
