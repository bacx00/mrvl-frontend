// src/lib/types.ts
// TypeScript type definitions for MRVL.net

// ═══════════════════════════════════════════════════════════════
//                        BASE TYPES
// ═══════════════════════════════════════════════════════════════

export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════
//                        USER TYPES
// ═══════════════════════════════════════════════════════════════

export interface User extends BaseEntity {
  username: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
  };
  role: 'user' | 'moderator' | 'admin' | 'writer' | 'editor';
  permissions: string[];
  verified: boolean;
  banned: boolean;
  last_seen_at?: string;
  stats: {
    posts_count: number;
    threads_count: number;
    reputation: number;
    achievements: Achievement[];
  };
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    replies: boolean;
    follows: boolean;
    news: boolean;
  };
  privacy: {
    profile_public: boolean;
    show_online_status: boolean;
    allow_direct_messages: boolean;
  };
  display: {
    show_spoilers: boolean;
    compact_mode: boolean;
    auto_play_videos: boolean;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
}

// ═══════════════════════════════════════════════════════════════
//                        AUTHENTICATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms_accepted: boolean;
  newsletter_subscription?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

// ═══════════════════════════════════════════════════════════════
//                        MATCH TYPES
// ═══════════════════════════════════════════════════════════════

export interface Match extends BaseEntity {
  team1: Team;
  team2: Team;
  team1_score: number;
  team2_score: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  event?: Event;
  tournament?: Tournament;
  format: 'bo1' | 'bo3' | 'bo5';
  maps: MatchMap[];
  stream_url?: string;
  betting_odds?: BettingOdds;
  live_stats?: LiveStats;
  winner?: Team;
  mvp?: Player;
}

export interface MatchDetails extends Match {
  timeline: MatchEvent[];
  player_stats: PlayerMatchStats[];
  team_stats: TeamMatchStats[];
  commentary: CommentaryEvent[];
  replay_url?: string;
  highlights: Highlight[];
}

export interface MatchMap {
  id: string;
  name: string;
  image: string;
  team1_score: number;
  team2_score: number;
  duration?: number;
  winner?: Team;
  status: 'upcoming' | 'live' | 'completed';
}

export interface MatchEvent {
  id: string;
  type: 'round_start' | 'round_end' | 'elimination' | 'ability_use' | 'objective';
  timestamp: string;
  description: string;
  player?: Player;
  team?: Team;
  details?: Record<string, any>;
}

export interface LiveStats {
  current_map: string;
  current_round: number;
  time_elapsed: number;
  viewer_count?: number;
  live_commentary?: string;
}

export interface BettingOdds {
  team1_odds: number;
  team2_odds: number;
  provider: string;
  last_updated: string;
}

export interface CommentaryEvent {
  id: string;
  timestamp: string;
  commentator: string;
  message: string;
  type: 'play_by_play' | 'analysis' | 'hype';
}

export interface Highlight {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  timestamp: string;
  duration: number;
  type: 'elimination' | 'team_fight' | 'clutch' | 'funny';
}

// ═══════════════════════════════════════════════════════════════
//                        TEAM & PLAYER TYPES
// ═══════════════════════════════════════════════════════════════

export interface Team extends BaseEntity {
  name: string;
  tag: string;
  logo: string;
  region: 'americas' | 'emea' | 'apac' | 'china';
  country: string;
  country_code: string;
  description?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
  };
  players: Player[];
  coach?: Coach;
  manager?: Manager;
  ranking: {
    global: number;
    regional: number;
    points: number;
    trend: 'up' | 'down' | 'stable';
  };
  stats: TeamStats;
  achievements: TeamAchievement[];
  sponsors: Sponsor[];
}

export interface Player extends BaseEntity {
  username: string;
  real_name?: string;
  avatar: string;
  team?: Team;
  role: 'dps' | 'tank' | 'support' | 'flex';
  country: string;
  country_code: string;
  age?: number;
  birthday?: string;
  bio?: string;
  social_links?: {
    twitter?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
  };
  stats: PlayerStats;
  achievements: PlayerAchievement[];
  transfer_history: Transfer[];
  contract?: Contract;
}

export interface Coach extends BaseEntity {
  name: string;
  avatar?: string;
  team: Team;
  country: string;
  country_code: string;
  experience_years: number;
  achievements: Achievement[];
}

export interface Manager extends BaseEntity {
  name: string;
  avatar?: string;
  team: Team;
  contact_email?: string;
  role: 'general_manager' | 'team_manager' | 'operations';
}

export interface PlayerStats {
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  eliminations: number;
  deaths: number;
  assists: number;
  kda_ratio: number;
  damage_per_round: number;
  healing_per_round?: number;
  first_bloods: number;
  clutches: number;
  mvp_awards: number;
  rating: number;
}

export interface TeamStats {
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  maps_won: number;
  maps_lost: number;
  map_win_rate: number;
  tournament_wins: number;
  prize_money_earned: number;
  current_streak: number;
  streak_type: 'wins' | 'losses';
  head_to_head: Record<string, HeadToHeadStats>;
}

export interface HeadToHeadStats {
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  maps_won: number;
  maps_lost: number;
  last_match_date: string;
}

export interface PlayerMatchStats {
  player: Player;
  eliminations: number;
  deaths: number;
  assists: number;
  damage_dealt: number;
  healing_done?: number;
  abilities_used: Record<string, number>;
  time_alive: number;
  first_bloods: number;
  multi_kills: number;
  rating: number;
}

export interface TeamMatchStats {
  team: Team;
  total_eliminations: number;
  total_deaths: number;
  total_damage: number;
  total_healing: number;
  objectives_captured: number;
  ultimate_usage: number;
  team_fights_won: number;
  first_picks: number;
}

export interface Transfer {
  id: string;
  player: Player;
  from_team?: Team;
  to_team: Team;
  transfer_date: string;
  transfer_type: 'signing' | 'trade' | 'release' | 'loan';
  fee?: number;
  announcement_url?: string;
}

export interface Contract {
  team: Team;
  start_date: string;
  end_date: string;
  salary?: number;
  currency?: string;
  contract_type: 'full_time' | 'part_time' | 'trial' | 'substitute';
}

export interface TeamAchievement {
  id: string;
  tournament: Tournament;
  placement: number;
  prize_money: number;
  date: string;
  roster: Player[];
}

export interface PlayerAchievement {
  id: string;
  title: string;
  description: string;
  tournament?: Tournament;
  date: string;
  type: 'tournament' | 'individual' | 'record';
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
  tier: 'title' | 'main' | 'partner' | 'supporter';
}

// ═══════════════════════════════════════════════════════════════
//                        EVENT & TOURNAMENT TYPES
// ═══════════════════════════════════════════════════════════════

export interface Event extends BaseEntity {
  name: string;
  description: string;
  logo: string;
  banner?: string;
  start_date: string;
  end_date: string;
  location?: string;
  venue?: string;
  region: 'global' | 'americas' | 'emea' | 'apac' | 'china';
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'league';
  prize_pool: number;
  currency: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  teams: Team[];
  matches: Match[];
  organizer: Organizer;
  sponsors: Sponsor[];
  streams: Stream[];
  rules_url?: string;
  registration_url?: string;
  bracket?: Bracket;
}

export interface EventDetails extends Event {
  detailed_schedule: ScheduleDay[];
  prize_distribution: PrizeDistribution[];
  statistics: EventStatistics;
  news_articles: NewsArticle[];
  highlights: Highlight[];
}

export interface Tournament extends Event {
  stage: 'qualifiers' | 'group_stage' | 'playoffs' | 'finals';
  qualification_spots?: number;
  invited_teams: Team[];
  qualified_teams: Team[];
}

export interface Organizer {
  id: string;
  name: string;
  logo: string;
  website?: string;
  contact_email?: string;
  social_links?: Record<string, string>;
}

export interface Stream {
  id: string;
  platform: 'twitch' | 'youtube' | 'facebook' | 'other';
  url: string;
  language: string;
  streamer_name?: string;
  viewer_count?: number;
  is_official: boolean;
}

export interface Bracket {
  id: string;
  type: 'single_elimination' | 'double_elimination';
  rounds: BracketRound[];
  grand_final?: Match;
}

export interface BracketRound {
  id: string;
  name: string;
  matches: Match[];
  round_number: number;
  is_completed: boolean;
}

export interface ScheduleDay {
  date: string;
  matches: Match[];
  special_events?: SpecialEvent[];
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'opening_ceremony' | 'closing_ceremony' | 'analyst_desk' | 'interview' | 'break';
}

export interface PrizeDistribution {
  placement: number;
  amount: number;
  percentage: number;
  team?: Team;
}

export interface EventStatistics {
  total_matches: number;
  total_eliminations: number;
  total_damage: number;
  average_match_duration: number;
  most_picked_heroes: HeroStats[];
  most_banned_heroes: HeroStats[];
  highest_kda: PlayerMatchStats;
  longest_match: Match;
}

export interface HeroStats {
  hero_name: string;
  pick_count: number;
  ban_count: number;
  win_rate: number;
}

// ═══════════════════════════════════════════════════════════════
//                        FORUM TYPES
// ═══════════════════════════════════════════════════════════════

export interface ForumCategory extends BaseEntity {
  name: string;
  description: string;
  slug: string;
  icon: string;
  color: string;
  position: number;
  parent_category?: ForumCategory;
  subcategories: ForumCategory[];
  threads_count: number;
  posts_count: number;
  last_post?: ForumPost;
  moderators: User[];
  permissions: {
    can_read: boolean;
    can_post: boolean;
    can_create_threads: boolean;
    required_role?: string;
  };
}

export interface ForumThread extends BaseEntity {
  title: string;
  slug: string;
  category: ForumCategory;
  author: User;
  posts: ForumPost[];
  posts_count: number;
  views_count: number;
  replies_count: number;
  last_post?: ForumPost;
  last_activity_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  tags: string[];
  vote_score: number;
  user_vote?: 'up' | 'down';
}

export interface ForumPost extends BaseEntity {
  content: string;
  content_html: string;
  thread: ForumThread;
  author: User;
  reply_to?: ForumPost;
  replies: ForumPost[];
  replies_count: number;
  is_edited: boolean;
  edited_at?: string;
  edited_by?: User;
  vote_score: number;
  user_vote?: 'up' | 'down';
  attachments: Attachment[];
  mentions: User[];
  reactions: Reaction[];
}

export interface Attachment {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: User[];
  user_reacted: boolean;
}

// ═══════════════════════════════════════════════════════════════
//                        NEWS TYPES
// ═══════════════════════════════════════════════════════════════

export interface NewsArticle extends BaseEntity {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_html: string;
  featured_image: string;
  featured_image_alt: string;
  author: User;
  category: NewsCategory;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  views_count: number;
  comments_count: number;
  reading_time: number;
  seo: {
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  };
  related_articles: NewsArticle[];
  comments: Comment[];
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  articles_count: number;
}

export interface Comment extends BaseEntity {
  content: string;
  author: User;
  article?: NewsArticle;
  parent_comment?: Comment;
  replies: Comment[];
  replies_count: number;
  vote_score: number;
  user_vote?: 'up' | 'down';
  is_edited: boolean;
  edited_at?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        RANKING TYPES
// ═══════════════════════════════════════════════════════════════

export interface Ranking extends BaseEntity {
  rank: number;
  previous_rank?: number;
  entity_type: 'team' | 'player';
  entity_id: string;
  team?: Team;
  player?: Player;
  region: 'global' | 'americas' | 'emea' | 'apac' | 'china';
  points: number;
  points_change: number;
  trend: 'up' | 'down' | 'stable';
  trend_positions: number;
  last_updated: string;
  statistics: RankingStats;
}

export interface RankingStats {
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  recent_form: ('W' | 'L')[];
  peak_rank: number;
  peak_rank_date: string;
  time_at_rank: number; // days
}

// ═══════════════════════════════════════════════════════════════
//                        STATISTICS TYPES
// ═══════════════════════════════════════════════════════════════

export interface Statistics {
  overview: {
    total_users: number;
    total_matches: number;
    total_teams: number;
    total_events: number;
    total_forum_posts: number;
    active_users_24h: number;
    matches_today: number;
    live_matches: number;
  };
  charts: {
    user_growth: ChartData[];
    match_activity: ChartData[];
    regional_distribution: ChartData[];
    popular_heroes: ChartData[];
  };
  trends: {
    most_active_regions: RegionActivity[];
    top_performing_teams: Team[];
    rising_players: Player[];
    popular_forum_topics: ForumThread[];
  };
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
  percentage?: number;
  color?: string;
}

export interface RegionActivity {
  region: string;
  matches_count: number;
  teams_count: number;
  growth_rate: number;
}

// ═══════════════════════════════════════════════════════════════
//                        SEARCH TYPES
// ═══════════════════════════════════════════════════════════════

export interface SearchResult {
  type: 'team' | 'player' | 'match' | 'event' | 'thread' | 'article';
  id: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  relevance_score: number;
  highlight?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  type?: SearchResult['type'][];
  region?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  status?: string[];
  author?: string;
  category?: string;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  page: number;
  per_page: number;
  sort_by?: 'relevance' | 'date' | 'popularity';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  suggestions?: string[];
  facets?: Record<string, FacetCount[]>;
}

export interface FacetCount {
  value: string;
  count: number;
}

// ═══════════════════════════════════════════════════════════════
//                        NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface Notification extends BaseEntity {
  type: 'mention' | 'reply' | 'like' | 'follow' | 'match_update' | 'system' | 'news';
  title: string;
  message: string;
  recipient: User;
  sender?: User;
  read: boolean;
  read_at?: string;
  action_url?: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  delivery_methods: ('in_app' | 'email' | 'push')[];
  expires_at?: string;
}

export interface NotificationSettings {
  in_app: boolean;
  email: boolean;
  push: boolean;
  types: {
    mentions: boolean;
    replies: boolean;
    likes: boolean;
    follows: boolean;
    match_updates: boolean;
    news: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
}

// ═══════════════════════════════════════════════════════════════
//                        ADMIN TYPES
// ═══════════════════════════════════════════════════════════════

export interface AdminStats {
  users: {
    total: number;
    active_today: number;
    new_this_week: number;
    banned: number;
    by_role: Record<string, number>;
  };
  content: {
    matches: number;
    events: number;
    forum_threads: number;
    forum_posts: number;
    news_articles: number;
  };
  engagement: {
    page_views_today: number;
    unique_visitors_today: number;
    average_session_duration: number;
    bounce_rate: number;
  };
  system: {
    server_uptime: number;
    response_time: number;
    error_rate: number;
    cache_hit_rate: number;
  };
}

export interface ModerationAction extends BaseEntity {
  type: 'warning' | 'mute' | 'ban' | 'delete_post' | 'lock_thread' | 'feature_thread';
  moderator: User;
  target_user?: User;
  target_content?: {
    type: 'post' | 'thread' | 'comment';
    id: string;
    title?: string;
  };
  reason: string;
  duration?: number; // in hours
  is_permanent: boolean;
  notes?: string;
  appeal?: ModerationAppeal;
}

export interface ModerationAppeal extends BaseEntity {
  action: ModerationAction;
  appellant: User;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: User;
  reviewed_at?: string;
  response?: string;
}

export interface UserReport extends BaseEntity {
  reporter: User;
  reported_user?: User;
  reported_content?: {
    type: 'post' | 'thread' | 'comment' | 'profile';
    id: string;
    url: string;
  };
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'cheating' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  assigned_moderator?: User;
  resolution?: string;
  resolved_at?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        FORM TYPES
// ═══════════════════════════════════════════════════════════════

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: FormFieldError[];
  touched: Record<string, boolean>;
  values: Record<string, any>;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  id?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        COMPONENT PROP TYPES
// ═══════════════════════════════════════════════════════════════

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  loading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'soft-rounded';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: string;
  badge?: string | number;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onClick?: (event: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  className?: string;
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'dark' | 'light' | 'system';
  actualTheme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleTheme: () => void;
}

export interface SearchContextType {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  filters: SearchFilters;
  recentSearches: string[];
  suggestions: string[];
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

// ═══════════════════════════════════════════════════════════════
//                        HOOK RETURN TYPES
// ═══════════════════════════════════════════════════════════════

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (event: React.FormEvent) => void;
  reset: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  removeValue: () => void;
}

export interface UseDebounceReturn<T> {
  debouncedValue: T;
  isDebouncing: boolean;
}

// ═══════════════════════════════════════════════════════════════
//                        UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type WithId<T> = T & { id: string };

export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

export type ApiEndpoint = string;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SortOrder = 'asc' | 'desc';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'dark' | 'light' | 'system';

export type Region = 'global' | 'americas' | 'emea' | 'apac' | 'china';

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type UserRole = 'user' | 'moderator' | 'admin' | 'writer' | 'editor';

export type NotificationType = 'mention' | 'reply' | 'like' | 'follow' | 'match_update' | 'system' | 'news';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'cheating' | 'other';

export type ModerationActionType = 'warning' | 'mute' | 'ban' | 'delete_post' | 'lock_thread' | 'feature_thread';

// ═══════════════════════════════════════════════════════════════
//                        EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export interface CustomEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface MatchUpdateEvent extends CustomEvent<{
  matchId: string;
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  currentMap?: string;
}> {
  type: 'match-updated' | 'match-started' | 'match-ended';
}

export interface ForumUpdateEvent extends CustomEvent<{
  threadId: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  action: 'created' | 'updated' | 'deleted';
}> {
  type: 'new-post' | 'post-updated' | 'post-deleted';
}

export interface NotificationEvent extends CustomEvent<Notification> {
  type: 'notification' | 'mention' | 'message';
}

export interface SystemEvent extends CustomEvent<{
  message: string;
  level: 'info' | 'warning' | 'error';
  affectedUsers?: string[];
}> {
  type: 'announcement' | 'system-message';
}

// ═══════════════════════════════════════════════════════════════
//                        EXPORT ALL TYPES
// ═══════════════════════════════════════════════════════════════

// Re-export commonly used types for convenience
export type {
  // React types
  ComponentProps,
  FC,
  ReactNode,
  MouseEvent,
  KeyboardEvent,
  FormEvent,
  ChangeEvent,
} from 'react';

// Next.js types
export type {
  NextPage,
  GetServerSideProps,
  GetStaticProps,
  GetStaticPaths,
} from 'next';
