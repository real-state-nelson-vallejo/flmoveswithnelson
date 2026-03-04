import { DaySchedule } from '@/backend/agenda/domain/Schedule';

interface ScheduleConfiguratorProps {
    schedule: DaySchedule[];
    onChange: (schedule: DaySchedule[]) => void;
    timezone: string;
    onTimezoneChange: (tz: string) => void;
    onSave?: () => void;
    isSaving?: boolean;
    showSaveButton?: boolean;
    title?: string;
    description?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleConfigurator({
    schedule,
    onChange,
    timezone,
    onTimezoneChange,
    onSave,
    isSaving = false,
    showSaveButton = true,
    title = "Weekly Schedule",
    description = "Configure the time blocks where Jesika can schedule appointments."
}: ScheduleConfiguratorProps) {

    function handleToggleDay(dayIndex: number) {
        onChange(schedule.map(day => {
            if (day.dayOfWeek === dayIndex) {
                const isActive = !day.isActive;
                return {
                    ...day,
                    isActive,
                    slots: isActive && day.slots.length === 0 ? [{ start: '09:00', end: '17:00' }] : day.slots
                };
            }
            return day;
        }));
    }

    function handleSlotChange(dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) {
        onChange(schedule.map(day => {
            if (day.dayOfWeek === dayIndex) {
                const newSlots = [...day.slots];
                const currentSlot = newSlots[slotIndex];
                if (!currentSlot) return day;

                if (field === 'start') {
                    newSlots[slotIndex] = { start: value, end: currentSlot.end };
                } else {
                    newSlots[slotIndex] = { start: currentSlot.start, end: value };
                }
                return { ...day, slots: newSlots };
            }
            return day;
        }));
    }

    function handleAddSlot(dayIndex: number) {
        onChange(schedule.map(day => {
            if (day.dayOfWeek === dayIndex) {
                return { ...day, slots: [...day.slots, { start: '12:00', end: '13:00' }] };
            }
            return day;
        }));
    }

    function handleRemoveSlot(dayIndex: number, slotIndex: number) {
        onChange(schedule.map(day => {
            if (day.dayOfWeek === dayIndex) {
                const newSlots = [...day.slots];
                newSlots.splice(slotIndex, 1);
                const isActive = newSlots.length > 0;
                return { ...day, slots: newSlots, isActive };
            }
            return day;
        }));
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">
                        {title}
                    </h2>
                    <p className="text-muted-foreground font-medium text-sm mt-1">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timezone}
                        onChange={e => onTimezoneChange(e.target.value)}
                        className="text-sm font-medium bg-background border border-input text-foreground py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                        <option value="America/Chicago">Central Time (US & Canada)</option>
                        <option value="America/Denver">Mountain Time (US & Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    </select>
                    {showSaveButton && onSave && (
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-card text-card-foreground border border-border rounded-[2rem] overflow-hidden shadow-sm">
                <div className="divide-y divide-border/50">
                    {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                        const dayConfig = schedule.find(s => s.dayOfWeek === dayIndex) || { dayOfWeek: dayIndex, isActive: false, slots: [] };
                        const { isActive, slots } = dayConfig;

                        return (
                            <div key={dayName} className={`p-6 md:p-8 flex flex-col md:flex-row gap-6 transition-colors duration-300 ${isActive ? 'bg-card' : 'bg-muted/30'}`}>

                                {/* Day Toggle & Name */}
                                <div className="w-full md:w-48 flex items-center justify-between md:justify-start gap-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleDay(dayIndex)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${isActive ? 'transform translate-x-6' : ''}`} />
                                        </button>
                                        <span className={`font-bold text-base ${isActive ? 'text-foreground' : 'text-muted-foreground'} w-24`}>
                                            {dayName}
                                        </span>
                                    </div>
                                    {!isActive && <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground md:hidden">Closed</span>}
                                </div>

                                {/* Time Slots */}
                                <div className="flex-1 flex flex-col gap-3">
                                    {isActive ? (
                                        <>
                                            {slots.map((slot, slotIndex) => (
                                                <div key={slotIndex} className="flex flex-wrap sm:flex-nowrap items-center gap-3 animate-in fade-in duration-300">
                                                    <input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'start', e.target.value)}
                                                        className="flex-1 sm:flex-none w-full sm:w-36 bg-background border border-input text-foreground font-medium text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                    <span className="text-muted-foreground font-medium text-sm hidden sm:block">-</span>
                                                    <input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'end', e.target.value)}
                                                        className="flex-1 sm:flex-none w-full sm:w-36 bg-background border border-input text-foreground font-medium text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                                                        title="Remove slot"
                                                        className="p-2 sm:p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ml-auto sm:ml-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSlot(dayIndex)}
                                                    className="text-primary hover:text-primary/80 hover:bg-muted text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors w-fit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                    Add hours
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-10 flex items-center text-sm font-bold text-muted-foreground uppercase tracking-widest hidden md:flex">
                                            Unavailable
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
