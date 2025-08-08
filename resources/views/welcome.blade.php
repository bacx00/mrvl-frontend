<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>MRVL - Marvel Rivals Esports Hub</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=space-grotesk:300,400,500,600,700" rel="stylesheet" />
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <style>
                @import 'tailwindcss';
            </style>
        @endif
    </head>
    <body class="bg-slate-900 text-white font-sans antialiased overflow-x-hidden">
        <div id="app"></div>
        <script type="module">
            // React and components will be loaded here
            import { createRoot } from 'https://esm.sh/react-dom@18/client';
            import { createElement as h, useState, useEffect, useCallback } from 'https://esm.sh/react@18';

            // API Configuration
            const API_BASE = 'https://staging.mrvl.net/api';
            const WEB_BASE = 'https://staging.mrvl.net';

            // API Helper Functions
            const apiClient = {
                async request(endpoint, options = {}) {
                    const token = localStorage.getItem('auth_token');
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...options.headers
                    };

                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    try {
                        const response = await fetch(`${API_BASE}${endpoint}`, {
                            ...options,
                            headers
                        });

                        if (!response.ok) {
                            if (response.status === 401) {
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('user');
                                // Trigger re-render by updating auth state
                                window.dispatchEvent(new Event('auth-change'));
                            }
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        return await response.json();
                    } catch (error) {
                        console.error('API request failed:', error);
                        throw error;
                    }
                },

                get(endpoint) {
                    return this.request(endpoint);
                },

                post(endpoint, data) {
                    return this.request(endpoint, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                },

                put(endpoint, data) {
                    return this.request(endpoint, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                },

                delete(endpoint) {
                    return this.request(endpoint, {
                        method: 'DELETE'
                    });
                }
            };

            // Auth Context
            function useAuth() {
                const [user, setUser] = useState(null);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const token = localStorage.getItem('auth_token');
                    const savedUser = localStorage.getItem('user');
                    
                    if (token && savedUser) {
                        setUser(JSON.parse(savedUser));
                    }
                    setLoading(false);

                    const handleAuthChange = () => {
                        const token = localStorage.getItem('auth_token');
                        const savedUser = localStorage.getItem('user');
                        if (token && savedUser) {
                            setUser(JSON.parse(savedUser));
                        } else {
                            setUser(null);
                        }
                    };

                    window.addEventListener('auth-change', handleAuthChange);
                    return () => window.removeEventListener('auth-change', handleAuthChange);
                }, []);

                const login = async (email, password) => {
                    try {
                        const response = await fetch(`${WEB_BASE}/login`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: JSON.stringify({ email, password })
                        });

                        const data = await response.json();
                        
                        if (response.ok && data.token) {
                            localStorage.setItem('auth_token', data.token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                            setUser(data.user);
                            window.dispatchEvent(new Event('auth-change'));
                            return { success: true };
                        } else {
                            return { success: false, error: data.message || 'Login failed' };
                        }
                    } catch (error) {
                        return { success: false, error: 'Network error' };
                    }
                };

                const logout = () => {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    setUser(null);
                    window.dispatchEvent(new Event('auth-change'));
                };

                const isAdmin = user && (user.role === 'admin' || user.role === 'editor');

                return { user, loading, login, logout, isAdmin };
            }

            // Data Hooks
            function useMatches() {
                const [matches, setMatches] = useState([]);
                const [loading, setLoading] = useState(true);
                const [error, setError] = useState(null);

                const fetchMatches = useCallback(async () => {
                    try {
                        setLoading(true);
                        const data = await apiClient.get('/matches');
                        setMatches(data.data || data);
                        setError(null);
                    } catch (err) {
                        setError(err.message);
                        // Fallback to mock data on error
                        setMatches([
                            {
                                id: 1,
                                team1: { name: "Avengers Elite", logo: "🛡️", region: "NA" },
                                team2: { name: "X-Force Gaming", logo: "⚡", region: "NA" },
                                scheduled_at: "2024-05-25T18:00:00Z",
                                status: "live",
                                event: { name: "Marvel Champions League" },
                                map: "Asgard Arena",
                                team1_score: 8,
                                team2_score: 6
                            },
                            {
                                id: 2,
                                team1: { name: "Guardians Squad", logo: "🚀", region: "EU" },
                                team2: { name: "SHIELD Ops", logo: "🎯", region: "EU" },
                                scheduled_at: "2024-05-25T20:30:00Z",
                                status: "upcoming",
                                event: { name: "European Rivals Cup" },
                                map: "Wakanda Labs"
                            }
                        ]);
                    } finally {
                        setLoading(false);
                    }
                }, []);

                useEffect(() => {
                    fetchMatches();
                }, [fetchMatches]);

                return { matches, loading, error, refetch: fetchMatches };
            }

            function useRankings() {
                const [rankings, setRankings] = useState([]);
                const [loading, setLoading] = useState(true);
                const [error, setError] = useState(null);

                useEffect(() => {
                    const fetchRankings = async () => {
                        try {
                            setLoading(true);
                            const data = await apiClient.get('/rankings');
                            setRankings(data.data || data);
                            setError(null);
                        } catch (err) {
                            setError(err.message);
                            // Fallback to mock data
                            setRankings([
                                { rank: 1, team: "Avengers Elite", logo: "🛡️", rating: 1847, region: "NA", win_rate: "87%" },
                                { rank: 2, team: "X-Force Gaming", logo: "⚡", rating: 1823, region: "NA", win_rate: "84%" },
                                { rank: 3, team: "Guardians Squad", logo: "🚀", rating: 1791, region: "EU", win_rate: "82%" },
                                { rank: 4, team: "SHIELD Ops", logo: "🎯", rating: 1765, region: "EU", win_rate: "79%" },
                                { rank: 5, team: "Fantastic Four", logo: "⭐", rating: 1742, region: "APAC", win_rate: "76%" }
                            ]);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchRankings();
                }, []);

                return { rankings, loading, error };
            }

            function useForums() {
                const [categories, setCategories] = useState([]);
                const [threads, setThreads] = useState([]);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const fetchForums = async () => {
                        try {
                            setLoading(true);
                            const data = await apiClient.get('/forums/categories');
                            setCategories(data.data || data);
                        } catch (err) {
                            // Fallback to mock data
                            setCategories([
                                { id: 1, name: "General Discussion", description: "Talk about Marvel Rivals", thread_count: 150, post_count: 2340 },
                                { id: 2, name: "Strategy & Meta", description: "Discuss tactics and hero picks", thread_count: 89, post_count: 1567 },
                                { id: 3, name: "Tournament Discussion", description: "Chat about ongoing tournaments", thread_count: 45, post_count: 890 },
                                { id: 4, name: "LFG - Looking for Group", description: "Find teammates to play with", thread_count: 78, post_count: 456 }
                            ]);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchForums();
                }, []);

                return { categories, threads, loading };
            }

            // Navigation Component
            function Navigation({ currentPage, setCurrentPage, showAdmin, setShowAdmin, onShowAuth }) {
                const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
                const { user, logout, isAdmin } = useAuth();

                const navItems = [
                    { id: 'home', label: 'Home' },
                    { id: 'matches', label: 'Matches' },
                    { id: 'rankings', label: 'Rankings' },
                    { id: 'teams', label: 'Teams' },
                    { id: 'heroes', label: 'Heroes' },
                    { id: 'events', label: 'Events' },
                    { id: 'forums', label: 'Forums' },
                    { id: 'news', label: 'News' }
                ];

                return h('header', { className: 'bg-slate-800 border-b border-slate-700 sticky top-0 z-50' },
                    h('div', { className: 'max-w-7xl mx-auto px-4' },
                        h('div', { className: 'flex items-center justify-between h-16' },
                            // Logo
                            h('div', { 
                                className: 'flex items-center space-x-4 cursor-pointer',
                                onClick: () => setCurrentPage('home')
                            },
                                h('div', { className: 'text-2xl font-bold text-white tracking-wider' }, 'MRVL'),
                                h('div', { className: 'hidden md:block text-sm text-slate-400' }, 'Marvel Rivals Esports')
                            ),
                            
                            // Desktop Navigation
                            h('nav', { className: 'hidden lg:flex space-x-6' },
                                ...navItems.map(item =>
                                    h('button', {
                                        key: item.id,
                                        onClick: () => setCurrentPage(item.id),
                                        className: `text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                                            currentPage === item.id 
                                                ? 'text-blue-400 bg-slate-700' 
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700'
                                        }`
                                    }, item.label)
                                )
                            ),

                            // User Menu & Controls
                            h('div', { className: 'flex items-center space-x-3' },
                                // Search
                                h('div', { className: 'hidden md:block relative' },
                                    h('input', {
                                        type: 'text',
                                        placeholder: 'Search...',
                                        className: 'bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500'
                                    })
                                ),

                                // Admin Toggle
                                isAdmin && h('button', {
                                    onClick: () => setShowAdmin(!showAdmin),
                                    className: `px-3 py-1 text-xs rounded-md transition-colors ${
                                        showAdmin 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`
                                }, showAdmin ? 'Exit Admin' : 'Admin'),

                                // User Menu
                                user ? h('div', { className: 'relative group' },
                                    h('button', { className: 'flex items-center space-x-2 px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors' },
                                        h('div', { className: 'w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold' }, 
                                            user.name?.charAt(0).toUpperCase() || 'U'
                                        ),
                                        h('span', { className: 'text-sm hidden sm:block' }, user.name || 'User')
                                    ),
                                    h('div', { className: 'absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all' },
                                        h('div', { className: 'py-1' },
                                            h('button', { 
                                                className: 'block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700',
                                                onClick: () => setCurrentPage('profile')
                                            }, 'Profile'),
                                            h('button', { 
                                                className: 'block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700',
                                                onClick: () => setCurrentPage('settings')
                                            }, 'Settings'),
                                            h('hr', { className: 'border-slate-700 my-1' }),
                                            h('button', { 
                                                className: 'block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700',
                                                onClick: logout
                                            }, 'Sign Out')
                                        )
                                    )
                                ) : h('button', {
                                    onClick: onShowAuth,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors'
                                }, 'Sign In'),
                                
                                // Mobile menu button
                                h('button', {
                                    className: 'lg:hidden p-2 text-slate-400 hover:text-white',
                                    onClick: () => setMobileMenuOpen(!mobileMenuOpen)
                                }, mobileMenuOpen ? '✕' : '☰')
                            )
                        ),

                        // Mobile Navigation
                        mobileMenuOpen && h('div', { className: 'lg:hidden py-4 border-t border-slate-700' },
                            h('nav', { className: 'flex flex-col space-y-1' },
                                ...navItems.map(item =>
                                    h('button', {
                                        key: item.id,
                                        onClick: () => {
                                            setCurrentPage(item.id);
                                            setMobileMenuOpen(false);
                                        },
                                        className: `text-left py-3 px-4 text-sm font-medium transition-colors rounded-md ${
                                            currentPage === item.id 
                                                ? 'text-blue-400 bg-slate-700' 
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700'
                                        }`
                                    }, item.label)
                                )
                            )
                        )
                    )
                );
            }

            // Auth Modal Component
            function AuthModal({ isOpen, onClose }) {
                const [isLogin, setIsLogin] = useState(true);
                const [email, setEmail] = useState('');
                const [password, setPassword] = useState('');
                const [name, setName] = useState('');
                const [loading, setLoading] = useState(false);
                const [error, setError] = useState('');
                const { login } = useAuth();

                const handleSubmit = async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError('');

                    if (isLogin) {
                        const result = await login(email, password);
                        if (result.success) {
                            onClose();
                        } else {
                            setError(result.error);
                        }
                    } else {
                        // Register logic would go here
                        setError('Registration not implemented in demo');
                    }
                    setLoading(false);
                };

                if (!isOpen) return null;

                return h('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' },
                    h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md' },
                        h('div', { className: 'p-6' },
                            h('div', { className: 'flex items-center justify-between mb-4' },
                                h('h2', { className: 'text-xl font-bold' }, isLogin ? 'Sign In' : 'Create Account'),
                                h('button', { 
                                    onClick: onClose,
                                    className: 'text-slate-400 hover:text-white'
                                }, '✕')
                            ),

                            h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                                !isLogin && h('div', null,
                                    h('label', { className: 'block text-sm font-medium mb-1' }, 'Name'),
                                    h('input', {
                                        type: 'text',
                                        value: name,
                                        onChange: (e) => setName(e.target.value),
                                        className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:border-blue-500',
                                        required: true
                                    })
                                ),

                                h('div', null,
                                    h('label', { className: 'block text-sm font-medium mb-1' }, 'Email'),
                                    h('input', {
                                        type: 'email',
                                        value: email,
                                        onChange: (e) => setEmail(e.target.value),
                                        className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:border-blue-500',
                                        required: true
                                    })
                                ),

                                h('div', null,
                                    h('label', { className: 'block text-sm font-medium mb-1' }, 'Password'),
                                    h('input', {
                                        type: 'password',
                                        value: password,
                                        onChange: (e) => setPassword(e.target.value),
                                        className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:border-blue-500',
                                        required: true
                                    })
                                ),

                                error && h('div', { className: 'text-red-400 text-sm' }, error),

                                h('button', {
                                    type: 'submit',
                                    disabled: loading,
                                    className: 'w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-md font-medium transition-colors'
                                }, loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account'))
                            ),

                            h('div', { className: 'mt-4 text-center' },
                                h('button', {
                                    onClick: () => setIsLogin(!isLogin),
                                    className: 'text-blue-400 hover:text-blue-300 text-sm'
                                }, isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in")
                            )
                        )
                    )
                );
            }

            // Match Card Component
            function MatchCard({ match }) {
                const getStatusColor = (status) => {
                    switch(status) {
                        case 'live': return 'bg-red-600 animate-pulse';
                        case 'upcoming': return 'bg-blue-600';
                        case 'completed': return 'bg-green-600';
                        default: return 'bg-slate-600';
                    }
                };

                const formatTime = (timeString) => {
                    const date = new Date(timeString);
                    return date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    });
                };

                const formatDate = (timeString) => {
                    const date = new Date(timeString);
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    });
                };

                return h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10' },
                    h('div', { className: 'flex items-center justify-between mb-3' },
                        h('div', { className: 'flex items-center space-x-2' },
                            h('span', { className: `px-2 py-1 text-xs rounded-full text-white font-medium ${getStatusColor(match.status)}` },
                                match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()
                            ),
                            h('span', { className: 'text-xs text-slate-400' }, match.event?.name || 'Tournament')
                        ),
                        h('div', { className: 'text-right text-xs text-slate-300' },
                            h('div', null, formatDate(match.scheduled_at || match.time)),
                            h('div', null, formatTime(match.scheduled_at || match.time))
                        )
                    ),

                    h('div', { className: 'flex items-center justify-between' },
                        // Team 1
                        h('div', { className: 'flex items-center space-x-3 flex-1' },
                            h('div', { className: 'text-center' },
                                h('div', { className: 'text-2xl mb-1' }, match.team1.logo || '🏆'),
                                h('div', { className: 'text-sm font-medium text-white' }, match.team1.name),
                                h('div', { className: 'text-xs text-slate-400' }, match.team1.region)
                            )
                        ),

                        // Score/VS
                        h('div', { className: 'text-center mx-4 px-4' },
                            (match.team1_score !== undefined && match.team2_score !== undefined) 
                                ? h('div', { className: 'text-xl font-bold text-blue-400' }, `${match.team1_score} : ${match.team2_score}`)
                                : h('div', { className: 'text-slate-400 font-medium' }, 'VS'),
                            h('div', { className: 'text-xs text-slate-500 mt-1' }, match.map || 'TBD')
                        ),

                        // Team 2
                        h('div', { className: 'flex items-center space-x-3 flex-1 justify-end' },
                            h('div', { className: 'text-center' },
                                h('div', { className: 'text-2xl mb-1' }, match.team2.logo || '🏆'),
                                h('div', { className: 'text-sm font-medium text-white' }, match.team2.name),
                                h('div', { className: 'text-xs text-slate-400' }, match.team2.region)
                            )
                        )
                    ),

                    match.status === 'live' && h('div', { className: 'mt-3 pt-3 border-t border-slate-700' },
                        h('div', { className: 'flex items-center justify-center space-x-4' },
                            h('button', { className: 'flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors' },
                                h('span', null, '🔴'),
                                h('span', null, 'Watch Live')
                            ),
                            h('button', { className: 'flex items-center space-x-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium transition-colors' },
                                h('span', null, '💬'),
                                h('span', null, 'Live Chat')
                            )
                        )
                    )
                );
            }

            // Loading Component
            function LoadingSpinner({ size = 'md' }) {
                const sizeClasses = {
                    sm: 'w-4 h-4',
                    md: 'w-8 h-8',
                    lg: 'w-12 h-12'
                };

                return h('div', { className: `${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-600 border-t-blue-500` });
            }

            // Error Component
            function ErrorMessage({ message, onRetry }) {
                return h('div', { className: 'bg-red-900/20 border border-red-700 rounded-lg p-4 text-center' },
                    h('div', { className: 'text-red-400 mb-2' }, '⚠️ Error'),
                    h('div', { className: 'text-slate-300 mb-3' }, message),
                    onRetry && h('button', {
                        onClick: onRetry,
                        className: 'px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors'
                    }, 'Try Again')
                );
            }

            // Continue with more components in the next part...
            
            // Home Component
            function Home() {
                const { matches, loading: matchesLoading } = useMatches();
                const { rankings, loading: rankingsLoading } = useRankings();

                const liveMatches = matches.filter(m => m.status === 'live');
                const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 3);
                const topTeams = rankings.slice(0, 5);

                return h('div', { className: 'space-y-8' },
                    // Hero Section
                    h('section', { 
                        className: 'relative bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 rounded-xl overflow-hidden',
                        style: {
                            backgroundImage: 'url(https://images.pexels.com/photos/7900587/pexels-photo-7900587.jpeg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }
                    },
                        h('div', { className: 'absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80' }),
                        h('div', { className: 'relative p-8 md:p-16 text-center' },
                            h('h1', { className: 'text-4xl md:text-7xl font-bold mb-6 text-white tracking-tight' }, 
                                'Marvel Rivals',
                                h('span', { className: 'block text-blue-400 text-3xl md:text-5xl mt-2' }, 'Esports Hub')
                            ),
                            h('p', { className: 'text-xl md:text-2xl text-slate-200 mb-8 max-w-3xl mx-auto' }, 
                                'The ultimate destination for Marvel Rivals competitive gaming. Watch live matches, track rankings, and join the community.'
                            ),
                            h('div', { className: 'flex flex-wrap justify-center gap-4' },
                                h('button', { className: 'px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25' }, 
                                    '🔴 Watch Live'
                                ),
                                h('button', { className: 'px-8 py-4 bg-slate-700/80 hover:bg-slate-600 rounded-lg font-medium text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm' }, 
                                    '🏆 View Rankings'
                                )
                            )
                        )
                    ),

                    // Live Matches Section
                    liveMatches.length > 0 && h('section', null,
                        h('div', { className: 'flex items-center justify-between mb-6' },
                            h('h2', { className: 'text-3xl font-bold flex items-center space-x-3' }, 
                                h('span', { className: 'text-red-500 animate-pulse' }, '🔴'),
                                h('span', null, 'Live Matches')
                            ),
                            h('button', { className: 'text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1' }, 
                                h('span', null, 'View All'),
                                h('span', null, '→')
                            )
                        ),
                        matchesLoading ? h('div', { className: 'flex justify-center py-8' }, h(LoadingSpinner, { size: 'lg' })) :
                        h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                            ...liveMatches.map(match =>
                                h(MatchCard, { key: match.id, match })
                            )
                        )
                    ),

                    // Main Content Grid
                    h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8' },
                        // Upcoming Matches
                        h('div', { className: 'lg:col-span-2' },
                            h('div', { className: 'flex items-center justify-between mb-6' },
                                h('h2', { className: 'text-2xl font-bold' }, 'Upcoming Matches'),
                                h('button', { className: 'text-blue-400 hover:text-blue-300 text-sm font-medium' }, 'View Schedule →')
                            ),
                            matchesLoading ? h('div', { className: 'flex justify-center py-8' }, h(LoadingSpinner)) :
                            h('div', { className: 'space-y-4' },
                                ...upcomingMatches.map(match =>
                                    h(MatchCard, { key: match.id, match })
                                )
                            )
                        ),

                        // Sidebar Content
                        h('div', { className: 'space-y-8' },
                            // Top Rankings
                            h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 p-6' },
                                h('h3', { className: 'text-xl font-bold mb-4 flex items-center space-x-2' },
                                    h('span', null, '🏆'),
                                    h('span', null, 'Top Teams')
                                ),
                                rankingsLoading ? h('div', { className: 'flex justify-center py-4' }, h(LoadingSpinner)) :
                                h('div', { className: 'space-y-3' },
                                    ...topTeams.map((team, index) =>
                                        h('div', { key: team.rank, className: 'flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors' },
                                            h('div', { className: 'flex items-center space-x-3' },
                                                h('div', { className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                    index === 2 ? 'bg-orange-600 text-white' : 'bg-slate-600'
                                                }` }, team.rank),
                                                h('span', { className: 'text-lg' }, team.logo),
                                                h('span', { className: 'font-medium' }, team.team)
                                            ),
                                            h('div', { className: 'text-right' },
                                                h('div', { className: 'text-blue-400 font-semibold' }, team.rating),
                                                h('div', { className: 'text-xs text-slate-400' }, team.win_rate || team.winRate)
                                            )
                                        )
                                    )
                                ),
                                h('button', { className: 'w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors' },
                                    'View Full Rankings'
                                )
                            ),

                            // Quick Stats
                            h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 p-6' },
                                h('h3', { className: 'text-xl font-bold mb-4' }, 'Platform Stats'),
                                h('div', { className: 'space-y-4' },
                                    h('div', { className: 'flex justify-between' },
                                        h('span', { className: 'text-slate-400' }, 'Active Players'),
                                        h('span', { className: 'font-semibold text-green-400' }, '12,847')
                                    ),
                                    h('div', { className: 'flex justify-between' },
                                        h('span', { className: 'text-slate-400' }, 'Live Viewers'),
                                        h('span', { className: 'font-semibold text-red-400' }, '3,421')
                                    ),
                                    h('div', { className: 'flex justify-between' },
                                        h('span', { className: 'text-slate-400' }, 'Matches Today'),
                                        h('span', { className: 'font-semibold text-blue-400' }, '28')
                                    ),
                                    h('div', { className: 'flex justify-between' },
                                        h('span', { className: 'text-slate-400' }, 'Teams Ranked'),
                                        h('span', { className: 'font-semibold text-purple-400' }, '156')
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Rankings Component
            function Rankings() {
                const { rankings, loading, error } = useRankings();
                const [selectedRegion, setSelectedRegion] = useState('all');

                const regions = ['all', 'NA', 'EU', 'APAC'];
                const filteredRankings = selectedRegion === 'all' 
                    ? rankings 
                    : rankings.filter(team => team.region === selectedRegion);

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));
                if (error) return h(ErrorMessage, { message: error });

                return h('div', { className: 'space-y-6' },
                    h('div', { className: 'flex justify-between items-center' },
                        h('h1', { className: 'text-3xl font-bold' }, 'Global Rankings'),
                        h('select', {
                            value: selectedRegion,
                            onChange: (e) => setSelectedRegion(e.target.value),
                            className: 'bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500'
                        },
                            ...regions.map(region =>
                                h('option', { key: region, value: region }, 
                                    region === 'all' ? 'All Regions' : region
                                )
                            )
                        )
                    ),

                    h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 overflow-hidden' },
                        h('div', { className: 'p-4 border-b border-slate-700' },
                            h('div', { className: 'grid grid-cols-5 gap-4 text-sm font-semibold text-slate-300' },
                                h('div', null, 'Rank'),
                                h('div', null, 'Team'),
                                h('div', null, 'Rating'),
                                h('div', null, 'Win Rate'),
                                h('div', null, 'Region')
                            )
                        ),
                        h('div', { className: 'divide-y divide-slate-700' },
                            ...filteredRankings.map(team =>
                                h('div', { key: team.rank, className: 'p-4 hover:bg-slate-700/50 transition-colors' },
                                    h('div', { className: 'grid grid-cols-5 gap-4 items-center' },
                                        h('div', null,
                                            h('div', { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                team.rank <= 3 ? 'bg-yellow-600' : 'bg-slate-600'
                                            }` }, team.rank)
                                        ),
                                        h('div', { className: 'flex items-center space-x-3' },
                                            h('div', { className: 'text-2xl' }, team.logo),
                                            h('div', { className: 'font-medium' }, team.team)
                                        ),
                                        h('div', { className: 'font-semibold text-blue-400' }, team.rating),
                                        h('div', { className: 'text-green-400' }, team.win_rate || team.winRate),
                                        h('div', { className: 'text-slate-400' }, team.region)
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Teams Component
            function Teams() {
                const [teams, setTeams] = useState([]);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const fetchTeams = async () => {
                        try {
                            setLoading(true);
                            // Mock data for now
                            setTeams([
                                {
                                    id: 1,
                                    name: "Avengers Elite",
                                    logo: "🛡️",
                                    region: "North America",
                                    players: ["TonyStark", "SteveRogers", "ThorGod", "BruceSmash", "NatRush"],
                                    wins: 13,
                                    losses: 2,
                                    rating: 1847
                                },
                                {
                                    id: 2,
                                    name: "X-Force Gaming",
                                    logo: "⚡",
                                    region: "North America", 
                                    players: ["Wolverine", "Deadpool", "Storm", "Cyclops", "Jean"],
                                    wins: 15,
                                    losses: 3,
                                    rating: 1823
                                },
                                {
                                    id: 3,
                                    name: "Guardians Squad",
                                    logo: "🚀",
                                    region: "Europe",
                                    players: ["StarLord", "Gamora", "Drax", "Rocket", "Groot"],
                                    wins: 11,
                                    losses: 4,
                                    rating: 1791
                                }
                            ]);
                        } catch (error) {
                            console.error('Failed to fetch teams:', error);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchTeams();
                }, []);

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));

                return h('div', { className: 'space-y-6' },
                    h('h1', { className: 'text-3xl font-bold mb-6' }, 'Teams'),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
                        ...teams.map(team =>
                            h('div', { key: team.id, className: 'bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors' },
                                h('div', { className: 'text-center mb-4' },
                                    h('div', { className: 'text-4xl mb-2' }, team.logo),
                                    h('h3', { className: 'text-xl font-bold' }, team.name),
                                    h('p', { className: 'text-slate-400' }, team.region)
                                ),
                                
                                h('div', { className: 'space-y-3' },
                                    h('div', { className: 'text-center' },
                                        h('div', { className: 'text-2xl font-bold text-green-400' }, `${team.wins}-${team.losses}`),
                                        h('div', { className: 'text-sm text-slate-400' }, 'W-L Record')
                                    ),
                                    
                                    h('div', null,
                                        h('h4', { className: 'font-medium mb-2' }, 'Roster'),
                                        h('div', { className: 'flex flex-wrap gap-2' },
                                            ...team.players.map(player =>
                                                h('span', { key: player, className: 'px-2 py-1 bg-slate-700 rounded text-xs' }, player)
                                            )
                                        )
                                    ),

                                    h('button', { className: 'w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors' },
                                        'View Profile'
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Heroes Component  
            function Heroes() {
                const [heroes, setHeroes] = useState([]);
                const [loading, setLoading] = useState(true);
                const [selectedRole, setSelectedRole] = useState('all');

                useEffect(() => {
                    const fetchHeroes = async () => {
                        try {
                            setLoading(true);
                            setHeroes([
                                { name: "Spider-Man", role: "Duelist", pickRate: "23.4%", winRate: "52.1%", difficulty: "Medium" },
                                { name: "Iron Man", role: "Vanguard", pickRate: "21.8%", winRate: "54.3%", difficulty: "Hard" },
                                { name: "Storm", role: "Strategist", pickRate: "19.2%", winRate: "58.7%", difficulty: "Medium" },
                                { name: "Hulk", role: "Vanguard", pickRate: "18.9%", winRate: "49.8%", difficulty: "Easy" },
                                { name: "Wolverine", role: "Duelist", pickRate: "17.6%", winRate: "51.2%", difficulty: "Medium" },
                                { name: "Doctor Strange", role: "Strategist", pickRate: "16.3%", winRate: "56.8%", difficulty: "Hard" }
                            ]);
                        } catch (error) {
                            console.error('Failed to fetch heroes:', error);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchHeroes();
                }, []);

                const roles = ['all', 'Duelist', 'Vanguard', 'Strategist'];
                const filteredHeroes = selectedRole === 'all' ? heroes : heroes.filter(hero => hero.role === selectedRole);

                const getRoleColor = (role) => {
                    switch(role) {
                        case 'Duelist': return 'text-red-400 bg-red-400/20';
                        case 'Vanguard': return 'text-blue-400 bg-blue-400/20';
                        case 'Strategist': return 'text-green-400 bg-green-400/20';
                        default: return 'text-slate-400 bg-slate-400/20';
                    }
                };

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));

                return h('div', { className: 'space-y-6' },
                    h('div', { className: 'flex justify-between items-center' },
                        h('h1', { className: 'text-3xl font-bold' }, 'Hero Meta Analysis'),
                        h('select', {
                            value: selectedRole,
                            onChange: (e) => setSelectedRole(e.target.value),
                            className: 'bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500'
                        },
                            ...roles.map(role =>
                                h('option', { key: role, value: role }, 
                                    role === 'all' ? 'All Roles' : role
                                )
                            )
                        )
                    ),

                    h('div', { className: 'bg-slate-800 rounded-lg border border-slate-700 overflow-hidden' },
                        h('div', { className: 'p-4 border-b border-slate-700' },
                            h('div', { className: 'grid grid-cols-6 gap-4 text-sm font-semibold text-slate-300' },
                                h('div', null, 'Hero'),
                                h('div', null, 'Role'),
                                h('div', null, 'Pick Rate'),
                                h('div', null, 'Win Rate'),
                                h('div', null, 'Difficulty'),
                                h('div', null, 'Trend')
                            )
                        ),
                        h('div', { className: 'divide-y divide-slate-700' },
                            ...filteredHeroes.map((hero, index) =>
                                h('div', { key: hero.name, className: 'p-4 hover:bg-slate-700/50 transition-colors' },
                                    h('div', { className: 'grid grid-cols-6 gap-4 items-center' },
                                        h('div', { className: 'font-semibold text-white' }, hero.name),
                                        h('div', null,
                                            h('span', { className: `px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(hero.role)}` },
                                                hero.role
                                            )
                                        ),
                                        h('div', { className: 'font-semibold text-blue-400' }, hero.pickRate),
                                        h('div', { className: 'font-semibold text-green-400' }, hero.winRate),
                                        h('div', { className: 'text-slate-300' }, hero.difficulty),
                                        h('div', { className: 'text-center' },
                                            Math.random() > 0.5 
                                                ? h('span', { className: 'text-green-400' }, '↗️')
                                                : h('span', { className: 'text-red-400' }, '↘️')
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Events Component  
            function Events() {
                const [events, setEvents] = useState([]);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const fetchEvents = async () => {
                        try {
                            setLoading(true);
                            setEvents([
                                {
                                    id: 1,
                                    name: "Marvel Champions League Grand Finals",
                                    description: "The biggest tournament of the year",
                                    startDate: "2024-06-15",
                                    prizePool: "$250,000",
                                    status: "upcoming",
                                    teams: 16,
                                    region: "Global"
                                },
                                {
                                    id: 2,
                                    name: "European Rivals Cup",
                                    description: "Regional championship for European teams",
                                    startDate: "2024-05-20",
                                    prizePool: "$75,000",
                                    status: "live",
                                    teams: 8,
                                    region: "Europe"
                                }
                            ]);
                        } catch (error) {
                            console.error('Failed to fetch events:', error);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchEvents();
                }, []);

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));

                return h('div', { className: 'space-y-6' },
                    h('h1', { className: 'text-3xl font-bold mb-6' }, 'Tournaments & Events'),
                    h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                        ...events.map(event =>
                            h('div', { key: event.id, className: 'bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors' },
                                h('div', { className: 'flex items-center justify-between mb-4' },
                                    h('span', { className: `px-3 py-1 rounded-full text-xs font-medium ${
                                        event.status === 'live' ? 'bg-red-600' : 
                                        event.status === 'upcoming' ? 'bg-blue-600' : 'bg-green-600'
                                    }` }, event.status.toUpperCase()),
                                    h('div', { className: 'text-right' },
                                        h('div', { className: 'text-xl font-bold text-green-400' }, event.prizePool),
                                        h('div', { className: 'text-xs text-slate-400' }, 'Prize Pool')
                                    )
                                ),
                                h('h3', { className: 'text-xl font-bold mb-2' }, event.name),
                                h('p', { className: 'text-slate-400 mb-4' }, event.description),
                                h('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
                                    h('div', null,
                                        h('div', { className: 'text-slate-400' }, 'Date'),
                                        h('div', { className: 'font-medium' }, new Date(event.startDate).toLocaleDateString())
                                    ),
                                    h('div', null,
                                        h('div', { className: 'text-slate-400' }, 'Teams'),
                                        h('div', { className: 'font-medium' }, event.teams)
                                    )
                                ),
                                h('button', { className: 'w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors' },
                                    event.status === 'live' ? 'Watch Live' : 'View Details'
                                )
                            )
                        )
                    )
                );
            }

            // Forums Component
            function Forums() {
                const { categories, loading } = useForums();

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));

                return h('div', { className: 'space-y-6' },
                    h('h1', { className: 'text-3xl font-bold mb-6' }, 'Community Forums'),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
                        ...categories.map(category =>
                            h('div', { key: category.id, className: 'bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer' },
                                h('h3', { className: 'text-xl font-bold mb-2 text-blue-400' }, category.name),
                                h('p', { className: 'text-slate-400 mb-4' }, category.description),
                                h('div', { className: 'flex justify-between text-sm' },
                                    h('span', { className: 'text-slate-500' }, `${category.thread_count} threads`),
                                    h('span', { className: 'text-slate-500' }, `${category.post_count} posts`)
                                )
                            )
                        )
                    )
                );
            }

            // News Component
            function News() {
                const [articles, setArticles] = useState([]);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const fetchNews = async () => {
                        try {
                            setLoading(true);
                            setArticles([
                                {
                                    id: 1,
                                    title: "Marvel Champions League Grand Finals Announced",
                                    excerpt: "The biggest tournament of the year brings together the world's best Marvel Rivals teams...",
                                    image: "https://images.pexels.com/photos/8728559/pexels-photo-8728559.jpeg",
                                    publishedAt: "2024-05-25",
                                    author: "Nick Fury",
                                    category: "Tournaments"
                                },
                                {
                                    id: 2,
                                    title: "New Hero Balance Changes Coming to Marvel Rivals",
                                    excerpt: "Developer NetEase announces major balance updates affecting Spider-Man and Iron Man...",
                                    image: "https://images.unsplash.com/photo-1558680689-ce686c5e2fb8",
                                    publishedAt: "2024-05-24",
                                    author: "Stan Lee",
                                    category: "Updates"
                                }
                            ]);
                        } catch (error) {
                            console.error('Failed to fetch news:', error);
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchNews();
                }, []);

                if (loading) return h('div', { className: 'flex justify-center py-16' }, h(LoadingSpinner, { size: 'lg' }));

                return h('div', { className: 'space-y-6' },
                    h('h1', { className: 'text-3xl font-bold mb-6' }, 'Latest News'),
                    h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                        ...articles.map(article =>
                            h('article', { key: article.id, className: 'bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors' },
                                h('img', { 
                                    src: article.image, 
                                    alt: article.title,
                                    className: 'w-full h-48 object-cover'
                                }),
                                h('div', { className: 'p-6' },
                                    h('span', { className: 'px-2 py-1 bg-blue-600 rounded-full text-xs font-medium mb-3 inline-block' },
                                        article.category
                                    ),
                                    h('h2', { className: 'text-xl font-bold mb-2 hover:text-blue-400 cursor-pointer' }, article.title),
                                    h('p', { className: 'text-slate-300 mb-4' }, article.excerpt),
                                    h('div', { className: 'flex items-center justify-between text-sm text-slate-400' },
                                        h('span', null, `By ${article.author}`),
                                        h('span', null, new Date(article.publishedAt).toLocaleDateString())
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Main App Component
            function App() {
                const [currentPage, setCurrentPage] = useState('home');
                const [showAdmin, setShowAdmin] = useState(false);
                const [showAuth, setShowAuth] = useState(false);
                const { loading } = useAuth();

                if (loading) {
                    return h('div', { className: 'min-h-screen bg-slate-900 flex items-center justify-center' },
                        h('div', { className: 'text-center' },
                            h(LoadingSpinner, { size: 'lg' }),
                            h('div', { className: 'mt-4 text-slate-400' }, 'Loading MRVL...')
                        )
                    );
                }

                const renderPage = () => {
                    if (showAdmin) {
                        return h('div', { className: 'min-h-screen bg-red-900/5' },
                            h('div', { className: 'bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6' },
                                h('h1', { className: 'text-2xl font-bold text-red-400 mb-2' }, '⚠️ Admin Dashboard'),
                                h('p', { className: 'text-red-300' }, 'You are now in admin mode. Connected to Laravel backend at staging.mrvl.net')
                            ),
                            h('div', { className: 'text-center py-16' },
                                h('h2', { className: 'text-4xl font-bold mb-4' }, '🚧 Admin Panel'),
                                h('p', { className: 'text-slate-400 mb-6' }, 'Advanced admin functionality integrating with your Laravel backend.'),
                                h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto' },
                                    h('div', { className: 'bg-slate-800 p-6 rounded-lg border border-slate-700' },
                                        h('h3', { className: 'font-bold mb-2' }, 'Match Management'),
                                        h('p', { className: 'text-sm text-slate-400' }, 'Create and manage matches')
                                    ),
                                    h('div', { className: 'bg-slate-800 p-6 rounded-lg border border-slate-700' },
                                        h('h3', { className: 'font-bold mb-2' }, 'Team Management'),
                                        h('p', { className: 'text-sm text-slate-400' }, 'Manage teams and players')
                                    ),
                                    h('div', { className: 'bg-slate-800 p-6 rounded-lg border border-slate-700' },
                                        h('h3', { className: 'font-bold mb-2' }, 'Content Management'),
                                        h('p', { className: 'text-sm text-slate-400' }, 'Manage news and content')
                                    ),
                                    h('div', { className: 'bg-slate-800 p-6 rounded-lg border border-slate-700' },
                                        h('h3', { className: 'font-bold mb-2' }, 'Analytics'),
                                        h('p', { className: 'text-sm text-slate-400' }, 'View platform analytics')
                                    )
                                )
                            )
                        );
                    }
                    
                    switch(currentPage) {
                        case 'home': return h(Home);
                        case 'matches': 
                            const { matches, loading, error } = useMatches();
                            return h('div', { className: 'space-y-6' },
                                h('h1', { className: 'text-3xl font-bold mb-6' }, 'All Matches'),
                                loading ? h('div', { className: 'flex justify-center py-8' }, h(LoadingSpinner, { size: 'lg' })) :
                                error ? h(ErrorMessage, { message: error }) :
                                h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                                    ...matches.map(match => h(MatchCard, { key: match.id, match }))
                                )
                            );
                        case 'rankings': return h(Rankings);
                        case 'teams': return h(Teams);
                        case 'heroes': return h(Heroes);
                        case 'events': return h(Events);
                        case 'forums': return h(Forums);
                        case 'news': return h(News);
                        default: 
                            return h('div', { className: 'text-center py-16' },
                                h('h1', { className: 'text-4xl font-bold mb-4' }, '🚧 Coming Soon'),
                                h('p', { className: 'text-slate-400' }, `The ${currentPage} section is being built with full Laravel backend integration.`)
                            );
                    }
                };

                return h('div', { className: 'min-h-screen bg-slate-900' },
                    h(Navigation, { 
                        currentPage, 
                        setCurrentPage, 
                        showAdmin, 
                        setShowAdmin,
                        onShowAuth: () => setShowAuth(true)
                    }),
                    h(AuthModal, {
                        isOpen: showAuth,
                        onClose: () => setShowAuth(false)
                    }),
                    h('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
                        renderPage()
                    ),
                    h('footer', { className: 'bg-slate-800 border-t border-slate-700 mt-16' },
                        h('div', { className: 'max-w-7xl mx-auto px-4 py-12' },
                            h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-8' },
                                h('div', null,
                                    h('h3', { className: 'text-xl font-bold mb-4' }, 'MRVL'),
                                    h('p', { className: 'text-slate-400 text-sm' }, 'The ultimate Marvel Rivals esports destination.')
                                ),
                                h('div', null,
                                    h('h4', { className: 'font-semibold mb-3' }, 'Matches'),
                                    h('div', { className: 'space-y-2 text-sm text-slate-400' },
                                        h('div', null, 'Live Matches'),
                                        h('div', null, 'Schedule'),
                                        h('div', null, 'Results')
                                    )
                                ),
                                h('div', null,
                                    h('h4', { className: 'font-semibold mb-3' }, 'Teams'),
                                    h('div', { className: 'space-y-2 text-sm text-slate-400' },
                                        h('div', null, 'Rankings'),
                                        h('div', null, 'Teams'),
                                        h('div', null, 'Players')
                                    )
                                ),
                                h('div', null,
                                    h('h4', { className: 'font-semibold mb-3' }, 'Community'),
                                    h('div', { className: 'space-y-2 text-sm text-slate-400' },
                                        h('div', null, 'Forums'),
                                        h('div', null, 'Discord'),
                                        h('div', null, 'Twitter')
                                    )
                                )
                            ),
                            h('div', { className: 'border-t border-slate-700 mt-8 pt-8 text-center text-slate-400' },
                                h('p', null, '© 2024 MRVL - Marvel Rivals Esports Hub. All rights reserved.'),
                                h('p', { className: 'text-sm mt-2' }, 'Connected to Laravel backend at staging.mrvl.net')
                            )
                        )
                    )
                );
            }

            // Initialize React App
            const container = document.getElementById('app');
            const root = createRoot(container);
            root.render(h(App));
        </script>
    </body>
</html>