"use client";

import { useState } from "react";
import { PostDTO, PostStatus, PostType } from "@/types/content"; // Use DTO from shared types
import { createPostAction, updatePostAction } from "@/actions/content/actions";
import { Loader2, Save, ArrowLeft, Wand2 } from "lucide-react";
import { generateBlogPostAction } from "../../actions/content/ai-actions"; // Will create this next

interface PostEditorProps {
    post?: PostDTO | null; // null means new post
    onSave: () => void;
    onCancel: () => void;
}

export function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [formData, setFormData] = useState<Partial<PostDTO>>({
        title: post?.title || "",
        slug: post?.slug || "",
        content: post?.content || "",
        type: post?.type || "blog",
        status: post?.status || "draft",
        tags: post?.tags || [],
        coverImage: post?.coverImage ?? "",
        excerpt: post?.excerpt ?? ""
    });


    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateAI = async () => {
        if (!formData.title) {
            alert("Please enter a title first to generate content.");
            return;
        }
        setGenerating(true);
        try {
            const result = await generateBlogPostAction(formData.title, formData.type || 'blog');
            if (result.success && result.content) {
                setFormData(prev => ({
                    ...prev,
                    content: result.content,
                    excerpt: result.excerpt || prev.excerpt
                }));
            } else {
                alert("Failed to generate content.");
            }
        } catch (error) {
            console.error(error);
            alert("Error generating content");
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (post?.id) {
                // Ensure typed properly
                await updatePostAction(post.id, {
                    title: formData.title || "",
                    content: formData.content || "",
                    slug: formData.slug || "",
                    excerpt: formData.excerpt || "",
                    coverImage: formData.coverImage || "",
                    type: formData.type as PostType,
                    status: formData.status as PostStatus,
                    tags: formData.tags || [],
                    publishDate: Date.now() // or preserve original? For now update update time
                });
            } else {
                await createPostAction({
                    title: formData.title || "Untitled",
                    content: formData.content || "",
                    ...(formData.slug ? { slug: formData.slug } : {}),
                    ...(formData.excerpt ? { excerpt: formData.excerpt } : {}),
                    ...(formData.coverImage ? { coverImage: formData.coverImage } : {}),
                    type: formData.type as PostType,
                    status: formData.status as PostStatus,
                    tags: formData.tags || [],
                    publishDate: Date.now()
                });
            }
            onSave();
        } catch {
            alert("Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-semibold text-slate-800">{post ? "Edit Post" : "New Post"}</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateAI}
                        disabled={generating || loading}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        AI Write
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || generating}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-6">
                <div>
                    <input
                        type="text"
                        placeholder="Post Title"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="w-full text-3xl font-bold placeholder-slate-300 border-none outline-none focus:ring-0 bg-transparent"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange("status", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900 transition-colors"
                        >
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange("type", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900 transition-colors"
                        >
                            <option value="blog">Blog Article</option>
                            <option value="news">News / Update</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Excerpt</label>
                    <textarea
                        value={formData.excerpt || ""}
                        onChange={(e) => handleChange("excerpt", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900 resize-none"
                        placeholder="Brief summary for SEO and cards..."
                    />
                </div>

                <div className="flex-1 min-h-[400px] border border-slate-200 rounded-lg p-4 focus-within:ring-2 focus-within:ring-slate-100 transition-shadow">
                    <textarea
                        value={formData.content}
                        onChange={(e) => handleChange("content", e.target.value)}
                        className="w-full h-full min-h-[400px] border-none outline-none resize-none text-slate-700 leading-relaxed custom-scrollbar"
                        placeholder="Write your content here... (Markdown supported)"
                    />
                </div>
            </div>
        </div>
    );
}
