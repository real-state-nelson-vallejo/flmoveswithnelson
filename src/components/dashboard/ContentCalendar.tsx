"use client";

import { useState } from "react";
import { PostDTO } from "@/types/content";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContentCalendarProps {
    posts: PostDTO[];
}

export function ContentCalendar({ posts }: ContentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getPostsForDay = (day: number) => {
        return posts.filter(post => {
            const d = new Date(post.publishDate);
            return d.getDate() === day &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear();
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-foreground">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 divide-x divide-border divide-y">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background/50" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayPosts = getPostsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                    return (
                        <div key={day} className={`p-2 min-h-[80px] hover:bg-muted/50 transition-colors relative ${isToday ? 'bg-primary/5' : ''}`}>
                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                                {day}
                            </span>
                            <div className="space-y-1">
                                {dayPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${post.status === 'published' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                            post.status === 'scheduled' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                                                'bg-secondary text-muted-foreground border-border'
                                            }`}
                                        title={post.title}
                                    >
                                        {post.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
