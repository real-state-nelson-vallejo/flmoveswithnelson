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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 divide-y">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-slate-50/50" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayPosts = getPostsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                    return (
                        <div key={day} className={`p-2 min-h-[80px] hover:bg-slate-50 transition-colors relative ${isToday ? 'bg-indigo-50/30' : ''}`}>
                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                                {day}
                            </span>
                            <div className="space-y-1">
                                {dayPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${post.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' :
                                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
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
