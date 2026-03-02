"use client";

import { PostDTO } from "@/types/content";
import { Edit, Trash2, Globe, Clock, FileText } from "lucide-react";

interface ContentListProps {
    posts: PostDTO[];
    onEdit: (post: PostDTO) => void;
    onDelete: (id: string) => void;
}

export function ContentList({ posts, onEdit, onDelete }: ContentListProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-700 border-green-200';
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'news' ? <Globe size={14} /> : <FileText size={14} />;
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {posts.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                                No content found. Create your first post!
                            </td>
                        </tr>
                    ) : (
                        posts.map((post) => (
                            <tr key={post.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {post.title}
                                    <div className="text-xs text-muted-foreground font-normal truncate max-w-[200px] mt-0.5">
                                        {post.slug}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(post.status)} capitalize`}>
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                                        {getTypeIcon(post.type)}
                                        {post.type}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {new Date(post.publishDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(post)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(post.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
