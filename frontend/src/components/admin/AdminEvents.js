import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks';
import EventForm from './EventForm';

function AdminEvents() {
  const { api } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(12);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'date'
  });

  // Bulk operations
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'upcoming',
    type: 'tournament'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/admin/events?page=${page}&limit=${limit}`);
      const eventsData = response?.data?.data || response?.data || response || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load events';
      setError(errorMessage);
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.location?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at));
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'status') {
      filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }

    return filtered;
  }, [events, filters]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return filteredEvents.slice(startIndex, startIndex + eventsPerPage);
  }, [filteredEvents, currentPage, eventsPerPage]);

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleDeleteEvent = async (eventId, eventName) => {
    if (window.confirm(`Are you sure you want to delete event "${eventName}"? This action cannot be undone.`)) {
      try {
        const response = await api.delete(`/api/admin/events/${eventId}`);
        if (response.data?.success !== false) {
          await fetchEvents();
          alert('Event deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting event';
        alert(errorMessage);
      }
    }
  };

  const handleCreateEvent = () => {
    setEventFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'upcoming',
      type: 'tournament'
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventFormData({
      name: event.name || '',
      description: event.description || '',
      start_date: event.start_date?.slice(0, 10) || '',
      end_date: event.end_date?.slice(0, 10) || '',
      location: event.location || '',
      status: event.status || 'upcoming',
      type: event.type || 'tournament'
    });
    setShowEventModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    if (!eventFormData.name.trim()) {
      alert('Please enter an event name');
      return;
    }
    
    try {
      if (editingEvent) {
        const response = await api.put(`/api/admin/events/${editingEvent.id}`, eventFormData);
        if (response.data?.success !== false) {
          await fetchEvents();
          setShowEventModal(false);
          alert('Event updated successfully!');
        } else {
          throw new Error(response.data?.message || 'Event update failed');
        }
      } else {
        const response = await api.post('/api/admin/events', eventFormData);
        if (response.data?.success !== false) {
          await fetchEvents();
          setShowEventModal(false);
          alert('Event created successfully!');
        } else {
          throw new Error(response.data?.message || 'Event creation failed');
        }
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error submitting event';
      alert(errorMessage);
    }
  };

  // Bulk operations handlers
  const handleSelectEvent = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAllEvents = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedEvents.size === 0) return;
    
    const confirmMessage = `Are you sure you want to change status to "${newStatus}" for ${selectedEvents.size} events?`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/api/admin/events/bulk-update', {
          event_ids: Array.from(selectedEvents),
          status: newStatus
        });
        
        if (response.data?.success !== false) {
          await fetchEvents();
          setSelectedEvents(new Set());
          setShowBulkActions(false);
          alert(`${selectedEvents.size} events updated successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk update failed');
        }
      } catch (error) {
        console.error('Error in bulk status update:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk update failed';
        alert(errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedEvents.size} events? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/api/admin/events/bulk-delete', {
          event_ids: Array.from(selectedEvents)
        });
        
        if (response.data?.success !== false) {
          await fetchEvents();
          setSelectedEvents(new Set());
          setShowBulkActions(false);
          alert(`${selectedEvents.size} events deleted successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk delete failed');
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk delete failed';
        alert(errorMessage);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Events</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button onClick={fetchEvents} className="btn btn-outline-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage tournaments and events</p>
        </div>
        <button onClick={handleCreateEvent} className="btn btn-primary">
          Create New Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="tournament">Tournament</option>
              <option value="championship">Championship</option>
              <option value="qualifier">Qualifier</option>
              <option value="exhibition">Exhibition</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: 'all', type: 'all', sortBy: 'date' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedEvents.size} events selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusChange('upcoming')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Mark as Upcoming
                </button>
                <button
                  onClick={() => handleBulkStatusChange('live')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Mark as Live
                </button>
                <button
                  onClick={() => handleBulkStatusChange('completed')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedEvents(new Set());
                setShowBulkActions(false);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Select All */}
      {filteredEvents.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
              onChange={handleSelectAllEvents}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Select all {filteredEvents.length} events
            </span>
          </label>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedEvents.map((event) => (
          <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(event.id)}
                  onChange={() => handleSelectEvent(event.id)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 mx-3">
                  {event.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                  {event.status || 'TBD'}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {event.description || 'No description available'}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium mr-2">Start Date:</span>
                  {formatDate(event.start_date)}
                </div>
                {event.end_date && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium mr-2">End Date:</span>
                    {formatDate(event.end_date)}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium mr-2">Location:</span>
                    {event.location}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium mr-2">Teams:</span>
                  {event.team_count || 0} registered
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 btn btn-outline-primary text-sm">
                  View Details
                </button>
                <button 
                  onClick={() => handleEditEvent(event)}
                  className="flex-1 btn btn-outline-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id, event.name)}
                  className="btn btn-outline-danger text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* No Results */}
      {filteredEvents.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Events Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.type !== 'all'
              ? 'Try adjusting your filters to find more events.'
              : 'Get started by creating your first event.'}
          </p>
          <button onClick={handleCreateEvent} className="btn btn-primary">
            Create First Event
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {events.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🔴</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {events.filter(e => e.status === 'live').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Events</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {events.filter(e => e.status === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {events.filter(e => e.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
      </div>

      {/* Event Form Modal - Using EventForm Component */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <EventForm 
                eventId={editingEvent?.id} 
                navigateTo={(path) => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  fetchEvents();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEvents;