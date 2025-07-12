import React, { useMemo, useState, useContext, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { GeneratedContent, WordPressSite, Notification, LanguageContextType, PublishingOptions, ContentType } from '../types';
import PublishModal from './PublishModal';
import { LanguageContext } from '../App';
import { publishContent } from '../services/wordpressService';
import { ArticleIcon, ProductIcon } from '../constants';

interface CalendarViewProps {
    library: GeneratedContent[];
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    onUpdateLibraryItem: (contentId: string, updates: Partial<GeneratedContent>) => void;
    onRemoveFromLibrary: (contentId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ library, sites, showNotification, onUpdateLibraryItem, onRemoveFromLibrary }) => {
    const { t, language } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const externalEventsRef = useRef<HTMLUListElement>(null);

    const events = useMemo(() => {
        return library.map(content => ({
            id: content.id,
            title: content.title,
            start: content.scheduledFor,
            allDay: true,
            display: content.scheduledFor ? 'auto' : 'list-item',
            backgroundColor: content.type === ContentType.Article ? '#4338ca' : '#047857',
            borderColor: content.type === ContentType.Article ? '#6d28d9' : '#065f46',
            extendedProps: {
                content,
            },
        }));
    }, [library]);
    
    const unscheduledEvents = useMemo(() => {
        return events.filter(event => !event.start);
    }, [events]);
    
    useEffect(() => {
        if (externalEventsRef.current) {
            new Draggable(externalEventsRef.current, {
                itemSelector: '.fc-event-draggable',
                eventData: function(eventEl) {
                    const content = library.find(item => item.id === eventEl.dataset.id);
                    return {
                        id: eventEl.dataset.id,
                        title: eventEl.dataset.title,
                        allDay: true,
                        create: false,
                        backgroundColor: content?.type === ContentType.Article ? '#4338ca' : '#047857',
                        borderColor: content?.type === ContentType.Article ? '#6d28d9' : '#065f46',
                        extendedProps: { content }
                    };
                }
            });
        }
    }, [unscheduledEvents, library]);


    const handleEventDrop = (dropInfo: any) => {
        const { id } = dropInfo.event;
        const newDate = dropInfo.event.start;
        onUpdateLibraryItem(id, { scheduledFor: newDate.toISOString() });
    };

    const handleEventReceive = (dropInfo: any) => {
        const { id } = dropInfo.event;
        const newDate = dropInfo.event.start;
        onUpdateLibraryItem(id, { scheduledFor: newDate.toISOString() });
        showNotification({ message: t('itemScheduled'), type: 'success' });
        dropInfo.event.remove();
    };

    const handleEventClick = (clickInfo: any) => {
        const content = clickInfo.event.extendedProps.content;
        const contentSite = sites.find(s => s.id === content.siteId);

        if (contentSite?.isVirtual) {
            showNotification({ message: t('publishNotAvailableVirtual'), type: 'info' });
            return;
        }

        setSelectedContent(content);
        setIsPublishModalOpen(true);
    };

    const handlePublish = async (options: PublishingOptions) => {
        const selectedSite = sites.find(s => s.id === options.siteId);
        if (!selectedContent || !selectedSite) {
            showNotification({ message: 'Selected site not found.', type: 'error' });
            return;
        }
        setIsPublishing(true);

        try {
            const result = await publishContent(selectedSite, selectedContent, options);
             const message = options.status === 'future' 
                ? `Successfully scheduled! It will be published on ${new Date(options.scheduledAt!).toLocaleString()}.`
                : t('publishSuccess', { url: result.postUrl });

            showNotification({ message, type: 'success' });
            onRemoveFromLibrary(selectedContent.id);
            setIsPublishModalOpen(false);
            setSelectedContent(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t('calendarTitle')}</h1>
                <p className="text-gray-400 mt-1">{t('calendarHint')}</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700/50">
                    <FullCalendar
                        key={language} 
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        events={events.filter(e => e.start)}
                        editable={true}
                        droppable={true}
                        eventDrop={handleEventDrop}
                        eventReceive={handleEventReceive}
                        eventClick={handleEventClick}
                        height="100%"
                        locale={language}
                        firstDay={language === 'ar' ? 6 : 0}
                    />
                </div>
                <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700/50 flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-4 flex-shrink-0">{t('unscheduledDrafts')}</h2>
                    <ul ref={externalEventsRef} className="space-y-2 flex-grow overflow-y-auto">
                        {unscheduledEvents.length > 0 ? unscheduledEvents.map(event => (
                            <li 
                                key={event.id}
                                data-id={event.id}
                                data-title={event.title}
                                className="fc-event-draggable bg-gray-700 p-3 rounded-lg text-sm cursor-grab hover:bg-gray-600 transition-colors flex items-center"
                            >
                                <span className="me-2">{event.extendedProps.content.type === ContentType.Article ? <ArticleIcon/> : <ProductIcon/>}</span>
                                <span className="truncate">{event.title}</span>
                            </li>
                        )) : (
                            <p className="text-gray-500 text-sm text-center py-10">{t('noUnscheduledItems')}</p>
                        )}
                    </ul>
                </div>
            </div>

             {isPublishModalOpen && selectedContent && (
                <PublishModal
                    content={selectedContent}
                    sites={sites}
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    onPublish={handlePublish}
                    isPublishing={isPublishing}
                />
            )}
        </div>
    );
};

export default CalendarView;