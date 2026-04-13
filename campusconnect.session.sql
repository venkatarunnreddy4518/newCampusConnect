-- MySQL Database Initialization Script for CampusConnect
-- Set charset and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Enable foreign keys
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(255) PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  year VARCHAR(50),
  github_url TEXT,
  linkedin_url TEXT,
  gmail_url TEXT,
  achievements VARCHAR(1000) NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_email (email)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  UNIQUE (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_roles_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  permission VARCHAR(50) NOT NULL CHECK (
    permission IN (
      'event_manager',
      'club_manager',
      'registration_manager',
      'content_moderator'
    )
  ),
  scope VARCHAR(50) NOT NULL DEFAULT 'global',
  resource_id VARCHAR(255),
  granted_by VARCHAR(255),
  granted_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_permissions_user_id (user_id),
  INDEX idx_permissions_lookup (user_id, permission, scope, resource_id)
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  venue VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'Sports',
  is_live INTEGER NOT NULL DEFAULT 0,
  stream_url TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  max_capacity INTEGER,
  enable_whatsapp INTEGER NOT NULL DEFAULT 0,
  created_by VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_events_date (date)
);

CREATE TABLE IF NOT EXISTS clubs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  poster_url TEXT,
  trailer_url TEXT,
  max_members INTEGER,
  created_by VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_clubs_name (name)
);

CREATE TABLE IF NOT EXISTS club_memberships (
  id VARCHAR(255) PRIMARY KEY,
  club_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  joined_at DATETIME NOT NULL,
  UNIQUE (club_id, user_id),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_club_memberships_club_id (club_id),
  INDEX idx_club_memberships_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_category VARCHAR(100) NOT NULL,
  event_date DATETIME,
  event_venue VARCHAR(255),
  registered_at DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (
    status IN ('registered', 'attended', 'cancelled', 'approved', 'rejected')
  ),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_registrations_user_id (user_id),
  INDEX idx_registrations_event_name (event_name)
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_id_created_at (user_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS event_reminders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  registration_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_date DATETIME NOT NULL,
  reminder_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (
    reminder_status IN ('active', 'sent', 'cancelled')
  ),
  reminder_sent_at DATETIME,
  created_at DATETIME NOT NULL,
  UNIQUE (registration_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  INDEX idx_event_reminders_user_id (user_id),
  INDEX idx_event_reminders_registration_id (registration_id)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (
    message_type IN ('registration', 'reminder', 'cancellation')
  ),
  message_body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed')
  ),
  whatsapp_message_id VARCHAR(255),
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_whatsapp_messages_user_id (user_id),
  INDEX idx_whatsapp_messages_status (status),
  INDEX idx_whatsapp_messages_event_id (event_id)
);

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id VARCHAR(255) PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS live_matches (
  id VARCHAR(255) PRIMARY KEY,
  sport VARCHAR(100) NOT NULL DEFAULT 'Cricket',
  match_format VARCHAR(50) NOT NULL DEFAULT 'T20',
  team_a VARCHAR(255) NOT NULL,
  team_b VARCHAR(255) NOT NULL,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  wickets_a INTEGER NOT NULL DEFAULT 0,
  wickets_b INTEGER NOT NULL DEFAULT 0,
  overs_a VARCHAR(50) NOT NULL DEFAULT '0.0',
  overs_b VARCHAR(50) NOT NULL DEFAULT '0.0',
  extras_a INTEGER NOT NULL DEFAULT 0,
  extras_b INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
  detail TEXT,
  batting_team VARCHAR(10) NOT NULL DEFAULT 'A',
  created_by VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_live_matches_status_created_at (status, created_at DESC)
);

CREATE TABLE IF NOT EXISTS match_scorecard (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  team VARCHAR(100) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'batsman',
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate REAL DEFAULT 0,
  overs_bowled VARCHAR(50),
  maidens INTEGER DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  economy REAL DEFAULT 0,
  dismissal VARCHAR(255),
  batting_order INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (match_id) REFERENCES live_matches(id) ON DELETE CASCADE,
  INDEX idx_match_scorecard_match_id_order (match_id, batting_order)
);

INSERT IGNORE INTO site_settings (`key`, value, updated_at) VALUES
  ('hero_video_url', '', NOW());

INSERT IGNORE INTO events (
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

INSERT IGNORE INTO clubs (
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