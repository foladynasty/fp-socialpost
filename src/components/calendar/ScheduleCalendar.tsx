import { useMemo } from 'react';
import { Calendar, momentLocalizer, type SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import type { Post } from '../../types';
import { Badge } from '../ui/badge';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-custom.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Post;
}

interface ScheduleCalendarProps {
  posts: Post[];
  onSelectSlot: (date: Date) => void;
  onSelectEvent: (post: Post) => void;
}

export function ScheduleCalendar({
  posts,
  onSelectSlot,
  onSelectEvent,
}: ScheduleCalendarProps) {
  // Convert posts to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return posts.map((post) => ({
      id: post.id,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      start: new Date(post.scheduled_date),
      end: new Date(post.scheduled_date),
      resource: post,
    }));
  }, [posts]);

  // Count posts by status
  const statusCounts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [posts]);

  // Custom event style based on post status
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#9ca3af'; // gray for draft

    switch (status) {
      case 'pending':
        backgroundColor = '#fbbf24'; // yellow
        break;
      case 'approved':
        backgroundColor = '#10b981'; // green
        break;
      case 'rejected':
        backgroundColor = '#ef4444'; // red
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: status === 'pending' ? '#78350f' : 'white',
        border: 'none',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  return (
    <div className="space-y-4">
      {/* Status badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="draft">
          Draft ({statusCounts.draft || 0})
        </Badge>
        <Badge variant="pending">
          Pending ({statusCounts.pending || 0})
        </Badge>
        <Badge variant="approved">
          Approved ({statusCounts.approved || 0})
        </Badge>
        <Badge variant="rejected">
          Rejected ({statusCounts.rejected || 0})
        </Badge>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-white p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={(slotInfo: SlotInfo) => onSelectSlot(slotInfo.start as Date)}
          onSelectEvent={(event: CalendarEvent) => onSelectEvent(event.resource)}
          eventPropGetter={eventStyleGetter}
          selectable
          views={['month']}
          defaultView="month"
          popup
          className="custom-calendar"
        />
      </div>

      {/* Legend */}
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Click on an empty date to create a new post, or click on an existing post to edit it.
        </p>
      </div>
    </div>
  );
}
