PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  year TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  gmail_url TEXT,
  achievements TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (
    permission IN (
      'event_manager',
      'club_manager',
      'registration_manager',
      'content_moderator'
    )
  ),
  scope TEXT NOT NULL DEFAULT 'global',
  resource_id TEXT,
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Sports',
  is_live INTEGER NOT NULL DEFAULT 0,
  stream_url TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  max_capacity INTEGER,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  poster_url TEXT,
  trailer_url TEXT,
  max_members INTEGER,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS club_memberships (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  joined_at TEXT NOT NULL,
  UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_date TEXT,
  event_venue TEXT,
  registered_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('registered', 'attended', 'cancelled', 'approved', 'rejected')
  )
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS live_matches (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL DEFAULT 'Cricket',
  match_format TEXT NOT NULL DEFAULT 'T20',
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  wickets_a INTEGER NOT NULL DEFAULT 0,
  wickets_b INTEGER NOT NULL DEFAULT 0,
  overs_a TEXT NOT NULL DEFAULT '0.0',
  overs_b TEXT NOT NULL DEFAULT '0.0',
  extras_a INTEGER NOT NULL DEFAULT 0,
  extras_b INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  detail TEXT,
  batting_team TEXT NOT NULL DEFAULT 'A',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_scorecard (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES live_matches(id) ON DELETE CASCADE,
  team TEXT NOT NULL,
  player_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'batsman',
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate REAL DEFAULT 0,
  overs_bowled TEXT,
  maidens INTEGER DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  economy REAL DEFAULT 0,
  dismissal TEXT,
  batting_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_lookup ON permissions(user_id, permission, scope, resource_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_name ON registrations(event_name);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_matches_status_created_at ON live_matches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_scorecard_match_id_order ON match_scorecard(match_id, batting_order);

INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES
  ('hero_video_url', '', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO events (
  id,
  name,
  date,
  venue,
  description,
  category,
  is_live,
  stream_url,
  poster_url,
  trailer_url,
  max_capacity,
  created_at,
  updated_at
) VALUES
  (
    'seed-event-cricket-finals',
    'Cricket Tournament Finals',
    '2026-03-12',
    'Main Ground',
    'The grand finale of inter-department cricket. CSE vs ECE battle it out for the championship title.',
    'Sports',
    1,
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-event-hackathon',
    'Hackathon 2026',
    '2026-03-15',
    'CS Lab Block',
    '24-hour coding marathon. Build innovative solutions to real-world problems.',
    'Technical',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-event-cultural-fest',
    'Annual Cultural Fest',
    '2026-03-20',
    'Open Air Theatre',
    'Music, dance, drama and art, the biggest cultural celebration of the year.',
    'Cultural',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-event-ai-workshop',
    'AI/ML Workshop',
    '2026-03-10',
    'Seminar Hall A',
    'Hands-on workshop on building machine learning models with Python and TensorFlow.',
    'Workshops',
    1,
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-event-basketball',
    'Basketball League',
    '2026-03-18',
    'Indoor Stadium',
    'Inter-college basketball league quarter-finals.',
    'Sports',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-event-web-bootcamp',
    'Web Dev Bootcamp',
    '2026-03-22',
    'IT Block Room 204',
    'Learn React, TypeScript and modern web development practices.',
    'Workshops',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO clubs (
  id,
  name,
  description,
  category,
  poster_url,
  trailer_url,
  max_members,
  created_at,
  updated_at
) VALUES
  (
    'seed-club-coding',
    'Coding Club',
    'Learn programming, participate in hackathons, and build cool projects together.',
    'Technical',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-robotics',
    'Robotics Club',
    'Design, build and program robots. Compete in national robotics competitions.',
    'Technical',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-photography',
    'Photography Club',
    'Capture campus life through the lens. Weekly photo walks and editing workshops.',
    'Creative',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-music',
    'Music Club',
    'Jam sessions, band practice, and live performances at campus events.',
    'Creative',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-debate',
    'Debate Society',
    'Sharpen your public speaking and argumentation skills in weekly debates.',
    'Literary',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-sports',
    'Sports Committee',
    'Organize inter-department tournaments and manage sports facilities.',
    'Sports',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-entrepreneurship',
    'Entrepreneurship Cell',
    'Ideate, innovate and launch startups. Mentorship from industry leaders.',
    'Business',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-club-drama',
    'Drama Club',
    'Theatre productions, street plays, and acting workshops throughout the year.',
    'Creative',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
