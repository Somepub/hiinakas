CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_uid TEXT NOT NULL,
    player_name TEXT NOT NULL,
    win_count INTEGER DEFAULT 0, 
    loss_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_winner_uid TEXT NOT NULL,
    game_winner_name TEXT NOT NULL,
    game_other_players JSON NOT NULL,
    game_uid TEXT NOT NULL,
    game_duration TEXT NOT NULL,
    game_start_time TEXT NOT NULL,
    game_type INTEGER NOT NULL
);
