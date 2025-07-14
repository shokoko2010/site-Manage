import React, { useMemo, useState, useContext, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { GeneratedContent, WordPressSite, Notification, LanguageContextType, PublishingOptions, ContentType } from '../types';
import PublishModal from './PublishModal';
import { LanguageContext } from '../App';
import { publishContent, updatePost } from '../services/wordpressService';
import { ArticleIcon, ProductIcon, EyeIcon, ChatBubbleLeftIcon } from '../constants';

interface CalendarViewProps {
    library: GeneratedContent[];
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    onUpdateLibraryItem: (contentId: string, updates: Partial<GeneratedContent>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ library, sites, showNotification, onUpdateLibraryItem }) => {
    const { t, language } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const externalEventsRef = useRef<HTMLUListElement>(null);

    const events = useMemo(() => {
        return library.map(content => {
            let eventDate: string | undefined = content.scheduledFor;
            if (content.status === 'published' && !content.scheduledFor) {
                eventDate = content.createdAt.toISOString();
            }

            return {
                id: content.id,
                title: content.title,
                start: eventDate,
                allDay: true,
                display: eventDate ? 'auto' : 'list-item',
                backgroundColor: content.type === ContentType.Article ? '#4338ca' : '#047857',
                borderColor: content.type === ContentType.Article ? '#6d28d9' : '#065f46',
                className: content.status === 'published' ? 'published-event' : '',
                extendedProps: {
                    content,
                },
            };
        });
    }, [library]);
    
    const unscheduledEvents = useMemo(() => {
        return events.filter(event => !event.start && event.extendedProps.content.status !== 'published');
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
        
        if (content.status === 'published') {
             if (content.postLink) {
                window.open(content.postLink, '_blank');
            }
            return;
        }

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
             const isUpdate = (selectedContent as any)?.origin === 'synced';
             const postId = (selectedContent as any)?.postId;
            
             const result = isUpdate && postId
                ? await updatePost(selectedSite, postId, selectedContent as any, options)
                : await publishContent(selectedSite, selectedContent, options);
            
             const message = options.status === 'future' 
                ? `Successfully scheduled! It will be published on ${new Date(options.scheduledAt!).toLocaleString()}.`
                : t(isUpdate ? 'updateSuccess' : 'publishSuccess', { url: result.postUrl });

            showNotification({ message, type: 'success' });
            
            onUpdateLibraryItem(selectedContent.id, {
                status: 'published',
                postId: result.postId,
                postLink: result.postUrl,
                scheduledFor: options.status === 'future' && options.scheduledAt ? new Date(options.scheduledAt).toISOString() : new Date().toISOString()
            });

            setIsPublishModalOpen(false);
            setSelectedContent(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const eventContent = (arg: any) => {
        const { content } = arg.event.extendedProps;
        const stats = content.performanceStats;
        const isPublished = content.status === 'published';

        return (
            <div className="p-1.5 overflow-hidden text-left rtl:text-right">
                <b className="font-semibold block truncate leading-tight">{arg.event.title}</b>
                {isPublished && stats && (
                    <div className="text-xs flex items-center mt-1 text-gray-200">
                        <EyeIcon className="w-3.5 h-3.5 me-1" /> {stats.views}
                        <ChatBubbleLeftIcon className="w-3.5 h-3.5 me-1 ms-2.5" /> {stats.comments}
                    </div>
                )}
            </div>
        )
    }

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
                        eventContent={eventContent}
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
                    mode={(selectedContent as any).origin === 'synced' ? 'update' : 'publish'}
                />
            )}
        </div>
    );
};

export default CalendarView;