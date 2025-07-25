import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getEventLogoUrl } from '../../utils/imageUtils';

function AdminEvents({ navigateTo }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });
  const { api } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      // Use admin endpoint for simpler data structure
      const response = await api.get(`/admin/events${params.toString() ? `?${params.toString()}` : ''}`);
      const eventsData = response.data?.data || response.data || response || [];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId, eventName) => {
    const confirmMessage = `Are you sure you want to delete "${eventName}"?\n\nThis event has associated matches. Choose your option:`;
    const forceDelete = window.confirm(`${confirmMessage}\n\nOK = Force Delete (removes matches too)\nCancel = Cancel deletion`);
    
    if (forceDelete) {
      // User chose OK, so force delete
      try {
        // First try force delete
        await api.delete(`/admin/events/${eventId}?force=true`);
        await fetchEvents(); // Refresh the list
        alert('Event and all associated matches deleted successfully!');
      } catch (error) {
        console.error('Error force deleting event:', error);
        
        if (error.message.includes('422') && error.data?.can_force_delete) {
          // Backend suggests force delete, try alternative endpoint
          try {
            await api.delete(`/admin/events/${eventId}/force`);
            await fetchEvents(); // Refresh the list
            alert('Event force deleted successfully!');
          } catch (forceError) {
            console.error('Error with force delete endpoint:', forceError);
            alert(`Error deleting event: ${forceError.message}\n\nPlease try deleting associated matches first.`);
          }
        } else {
          alert(` Error deleting event: ${error.message}\n\nThe event has ${error.data?.match_count || 'some'} associated matches. Please try deleting them first.`);
        }
      }
    }
    // If user chose Cancel, do nothing
  };

  const updateEventStatus = async (eventId, newStatus) => {
    try {
      // FIXED: Fetch the full event first, then update only the status
      console.log(' Fetching full event data before update...');
      const eventResponse = await api.get(`/admin/events/${eventId}`);
      const eventData = eventResponse.data || eventResponse;
      
      console.log(' Full event data fetched:', eventData);
      
      // Update only the status in the complete event object
      const updateData = {
        ...eventData,
        status: newStatus
      };
      
      console.log('📤 Sending complete update data:', updateData);
      await api.put(`/admin/events/${eventId}`, updateData);
      await fetchEvents(); // Refresh the list
      alert(` Event status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating event status:', error);
      
      if (error.message.includes('422')) {
        alert(` Validation Error: ${error.message}\n\nMissing required fields. Please edit the event with complete information first.`);
      } else if (error.message.includes('404')) {
        alert(' Event not found. It may have been deleted.');
      } else {
        alert(` Error updating event status: ${error.message}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
      case 'ongoing': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'tournament': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'league': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'qualifier': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'showmatch': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const types = ['all', 'tournament', 'league', 'qualifier', 'showmatch'];
  const statuses = ['all', 'ongoing', 'upcoming', 'completed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Events</h2>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage all tournaments and events</p>
        </div>
        <button 
          onClick={() => navigateTo('admin-event-create')}
          className="btn btn-primary"
        >
           Create New Event
        </button>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {events.filter(e => e.status === 'live' || e.status === 'ongoing').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Events</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {events.filter(e => e.status === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${events.reduce((acc, e) => {
              const prizePool = typeof e.prize_pool === 'number' ? e.prize_pool : 
                             typeof e.prize_pool === 'string' ? parseInt(e.prize_pool.replace(/[$,]/g, '') || '0') : 0;
              return acc + prizePool;
            }, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Prize Pool</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {events.reduce((acc, e) => acc + (e.current_teams || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Teams</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Event Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="form-input"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-input"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: 'all', status: 'all' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {events.map(event => (
          <div key={event.id} className="card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Event Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {/* Event Logo */}
                  {event.logo ? (
                    <img 
                      src={getEventLogoUrl(event)}
                      alt={event.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400 font-bold text-xl"
                    style={{ display: event.logo ? 'none' : 'flex' }}
                  >
                    EVT
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(event.type)}`}>
                        {event.type ? event.type.toUpperCase() : 'TOURNAMENT'}
                      </span>
                      {event.registration_open && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium rounded">
                          REGISTRATION OPEN
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-500">Date:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                          {event.end_date && event.start_date !== event.end_date ? ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-500">Prize Pool:</span>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {event.prize_pool ? `$${Number(event.prize_pool).toLocaleString()} ${event.currency || 'USD'}` : 'TBD'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-500">Teams:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {event.current_teams || 0}/{event.max_teams || '?'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-500">Format:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {event.format ? event.format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'TBD'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-500">Organizer:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{typeof event.organizer === 'string' ? event.organizer : event.organizer?.name || 'Unknown Organizer'}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-500">Location:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:w-48">
                {event.status === 'upcoming' && (
                  <button
                    onClick={() => updateEventStatus(event.id, 'ongoing')}
                    className="btn bg-red-600 hover:bg-red-700 text-white"
                  >
                     Start Event
                  </button>
                )}
                {(event.status === 'live' || event.status === 'ongoing') && (
                  <button
                    onClick={() => updateEventStatus(event.id, 'completed')}
                    className="btn bg-green-600 hover:bg-green-700 text-white"
                  >
                     Complete Event
                  </button>
                )}
                <button 
                  onClick={() => navigateTo('event-detail', { id: event.id })}
                  className="btn btn-secondary"
                >
                   View Details
                </button>
                <button 
                  onClick={() => navigateTo('admin-event-edit', { id: event.id })}
                  className="btn btn-secondary"
                >
                   Edit Event
                </button>
                <button
                  onClick={() => handleDelete(event.id, event.name)}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                   Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {events.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Events Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.type !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters to find more events.'
              : 'Get started by creating your first event.'}
          </p>
          <button
            onClick={() => navigateTo('admin-event-create')}
            className="btn btn-primary"
          >
             Create First Event
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminEvents;