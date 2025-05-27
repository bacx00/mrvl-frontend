'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Team {
  id: number;
  name: string;
  logo?: string;
}

interface MatchFormData {
  team1_id: string;
  team2_id: string;
  score1: string;
  score2: string;
  date: string;
  format: string;
  status: string;
  event_name: string;
}

interface Match {
  id: number;
  team1: {
    id: number;
    name: string;
    logo?: string;
  };
  team2: {
    id: number;
    name: string;
    logo?: string;
  };
  score1?: number;
  score2?: number;
  date: string;
  format: string;
  status: 'upcoming' | 'live' | 'completed';
  event_name: string;
}

export default function AdminMatchesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form data and state
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [formData, setFormData] = useState<MatchFormData>({
    team1_id: '',
    team2_id: '',
    score1: '',
    score2: '',
    date: new Date().toISOString().slice(0, 16), // Format: 2023-04-28T15:30
    format: 'bo3',
    status: 'upcoming',
    event_name: ''
  });
  
  // UI state
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is authorized to access admin page
    if (!user) {
      setLoading(true);
      return;
    }
    
    if (user.role !== 'admin') {
      router.replace('/user/login');
      return;
    }

    // Fetch teams and matches data
    const fetchData = async () => {
      try {
        // Fetch teams
        // In a real implementation, we would fetch from a proper API endpoint
        // For now, we'll create mock data
        const mockTeams: Team[] = [
          { id: 1, name: "Sentinels", logo: "/teams/sentinels-logo.png" },
          { id: 2, name: "Cloud9", logo: "/teams/cloud9-logo.png" },
          { id: 3, name: "100 Thieves", logo: "/teams/100t-logo.png" },
          { id: 4, name: "G2 Esports", logo: "/teams/g2-logo.png" },
          { id: 5, name: "Fnatic", logo: "/teams/fnatic-logo.png" },
          { id: 6, name: "Team Liquid", logo: "/teams/liquid-logo.png" },
          { id: 7, name: "DRX", logo: "/teams/drx-logo.png" },
          { id: 8, name: "Gen.G", logo: "/teams/geng-logo.png" }
        ];
        
        // Fetch matches
        const mockMatches: Match[] = [
          { 
            id: 1, 
            team1: mockTeams[0], 
            team2: mockTeams[1], 
            score1: 2, 
            score2: 1, 
            date: "2025-05-15T18:00:00", 
            format: "bo3", 
            status: "completed", 
            event_name: "Marvel Rivals Championship 2025" 
          },
          { 
            id: 2, 
            team1: mockTeams[2], 
            team2: mockTeams[3], 
            score1: 1, 
            score2: 1, 
            date: "2025-05-20T15:00:00", 
            format: "bo3", 
            status: "live", 
            event_name: "Marvel Rivals Championship 2025" 
          },
          { 
            id: 3, 
            team1: mockTeams[4], 
            team2: mockTeams[5], 
            date: "2025-05-25T12:00:00", 
            format: "bo5", 
            status: "upcoming", 
            event_name: "EMEA Qualifier Finals" 
          },
          { 
            id: 4, 
            team1: mockTeams[6], 
            team2: mockTeams[7], 
            date: "2025-05-30T09:00:00", 
            format: "bo3", 
            status: "upcoming", 
            event_name: "APAC Challenger Series" 
          }
        ];
        
        setTeams(mockTeams);
        setMatches(mockMatches);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router]);
  
  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.team1_id) {
      errors.team1_id = 'Team 1 is required';
    }
    
    if (!formData.team2_id) {
      errors.team2_id = 'Team 2 is required';
    }
    
    if (formData.team1_id === formData.team2_id && formData.team1_id) {
      errors.team2_id = 'Team 2 must be different from Team 1';
    }
    
    if (!formData.date) {
      errors.date = 'Date & Time is required';
    }
    
    if (!formData.event_name) {
      errors.event_name = 'Event name is required';
    }
    
    if (formData.status === 'completed') {
      if (!formData.score1 || isNaN(parseInt(formData.score1))) {
        errors.score1 = 'Valid score is required';
      }
      
      if (!formData.score2 || isNaN(parseInt(formData.score2))) {
        errors.score2 = 'Valid score is required';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setMessage(null);
      
      // In a real implementation, we would submit to an API
      // For now, we'll just simulate adding/updating a match
      
      const newMatch: Match = {
        id: isEditing && editId ? editId : matches.length + 1,
        team1: teams.find(t => t.id.toString() === formData.team1_id) as Team,
        team2: teams.find(t => t.id.toString() === formData.team2_id) as Team,
        date: formData.date,
        format: formData.format,
        status: formData.status as 'upcoming' | 'live' | 'completed',
        event_name: formData.event_name
      };
      
      if (formData.status === 'completed') {
        newMatch.score1 = parseInt(formData.score1);
        newMatch.score2 = parseInt(formData.score2);
      }
      
      if (isEditing && editId) {
        // Update existing match
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match.id === editId ? newMatch : match
          )
        );
        setMessage({ type: 'success', text: 'Match updated successfully!' });
      } else {
        // Add new match
        setMatches(prevMatches => [...prevMatches, newMatch]);
        setMessage({ type: 'success', text: 'Match created successfully!' });
      }
      
      // Reset form
      setFormData({
        team1_id: '',
        team2_id: '',
        score1: '',
        score2: '',
        date: new Date().toISOString().slice(0, 16),
        format: 'bo3',
        status: 'upcoming',
        event_name: ''
      });
      
      setIsEditing(false);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting match:', error);
      setMessage({ type: 'error', text: 'Failed to save match. Please try again.' });
    }
  };
  
  const handleEdit = (match: Match) => {
    setFormData({
      team1_id: match.team1.id.toString(),
      team2_id: match.team2.id.toString(),
      score1: match.score1?.toString() || '',
      score2: match.score2?.toString() || '',
      date: match.date,
      format: match.format,
      status: match.status,
      event_name: match.event_name
    });
    
    setIsEditing(true);
    setEditId(match.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      setMatches(prevMatches => prevMatches.filter(match => match.id !== id));
      setMessage({ type: 'success', text: 'Match deleted successfully!' });
    }
  };
  
  const handleCancel = () => {
    setFormData({
      team1_id: '',
      team2_id: '',
      score1: '',
      score2: '',
      date: new Date().toISOString().slice(0, 16),
      format: 'bo3',
      status: 'upcoming',
      event_name: ''
    });
    
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
    setFormErrors({});
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa4454]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Matches</h1>
        
        <div className="flex space-x-3">
          <Link 
            href="/admin" 
            className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
          
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-[#fa4454] hover:bg-[#e03a49] text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {showForm ? 'Hide Form' : 'Add New Match'}
          </button>
        </div>
      </div>
      
      {message && (
        <div 
          className={`mb-6 p-4 rounded ${
            message.type === 'success' 
              ? 'bg-green-800/30 border border-green-500 text-green-100' 
              : 'bg-red-800/30 border border-red-500 text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {/* Match Form */}
      {showForm && (
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Match' : 'Add New Match'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Team 1 */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Team 1</label>
                <select
                  name="team1_id"
                  className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                    formErrors.team1_id ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  value={formData.team1_id}
                  onChange={handleChange}
                >
                  <option value="">Select Team 1</option>
                  {teams.map(team => (
                    <option key={`t1-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {formErrors.team1_id && (
                  <p className="mt-1 text-sm text-[#fa4454]">{formErrors.team1_id}</p>
                )}
              </div>
              
              {/* Team 2 */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Team 2</label>
                <select
                  name="team2_id"
                  className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                    formErrors.team2_id ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  value={formData.team2_id}
                  onChange={handleChange}
                >
                  <option value="">Select Team 2</option>
                  {teams.map(team => (
                    <option key={`t2-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {formErrors.team2_id && (
                  <p className="mt-1 text-sm text-[#fa4454]">{formErrors.team2_id}</p>
                )}
              </div>
              
              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                    formErrors.date ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  value={formData.date}
                  onChange={handleChange}
                />
                {formErrors.date && (
                  <p className="mt-1 text-sm text-[#fa4454]">{formErrors.date}</p>
                )}
              </div>
              
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Event Name</label>
                <input
                  type="text"
                  name="event_name"
                  className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                    formErrors.event_name ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  value={formData.event_name}
                  onChange={handleChange}
                  placeholder="e.g. Marvel Rivals Championship"
                />
                {formErrors.event_name && (
                  <p className="mt-1 text-sm text-[#fa4454]">{formErrors.event_name}</p>
                )}
              </div>
              
              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Format</label>
                <select
                  name="format"
                  className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454]"
                  value={formData.format}
                  onChange={handleChange}
                >
                  <option value="bo1">Best of 1</option>
                  <option value="bo3">Best of 3</option>
                  <option value="bo5">Best of 5</option>
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Status</label>
                <select
                  name="status"
                  className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454]"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {/* Score inputs (only shown for completed matches) */}
            {formData.status === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Team 1 Score</label>
                  <input
                    type="number"
                    name="score1"
                    min="0"
                    className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                      formErrors.score1 ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                    }`}
                    value={formData.score1}
                    onChange={handleChange}
                  />
                  {formErrors.score1 && (
                    <p className="mt-1 text-sm text-[#fa4454]">{formErrors.score1}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Team 2 Score</label>
                  <input
                    type="number"
                    name="score2"
                    min="0"
                    className={`w-full bg-[#0f1923] border rounded-md shadow-sm px-4 py-2 text-white focus:outline-none focus:ring-[#fa4454] focus:border-[#fa4454] ${
                      formErrors.score2 ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                    }`}
                    value={formData.score2}
                    onChange={handleChange}
                  />
                  {formErrors.score2 && (
                    <p className="mt-1 text-sm text-[#fa4454]">{formErrors.score2}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="bg-[#fa4454] hover:bg-[#e03a49] text-white px-4 py-2 rounded text-sm transition-colors"
              >
                {isEditing ? 'Update Match' : 'Create Match'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Matches Table */}
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Match List</h2>
        
        {matches.length === 0 ? (
          <div className="text-center py-6 text-[#768894]">
            No matches found. Create your first match using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-[#0f1923] text-[#768894] text-left">
                <tr>
                  <th className="px-4 py-2 rounded-tl-md">Teams</th>
                  <th className="px-4 py-2">Event</th>
                  <th className="px-4 py-2">Format</th>
                  <th className="px-4 py-2">Date & Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2 rounded-tr-md">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b3d4d]">
                {matches.map(match => (
                  <tr key={match.id} className="hover:bg-[#20303d]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{match.team1.name} vs {match.team2.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{match.event_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="uppercase text-sm">{match.format}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(match.date)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-white text-xs rounded ${
                        match.status === 'live' 
                          ? 'bg-red-500' 
                          : match.status === 'upcoming' 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                      }`}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {match.status === 'completed' ? (
                        <div className="font-medium">{match.score1} - {match.score2}</div>
                      ) : (
                        <div className="text-[#768894] text-sm">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(match)}
                          className="p-1 text-[#768894] hover:text-white"
                          title="Edit match"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(match.id)}
                          className="p-1 text-[#768894] hover:text-[#fa4454]"
                          title="Delete match"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
