pub mod card {
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/proto/card.rs"));
}

pub mod game {
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/proto/game.rs"));
}

pub mod lobby {
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/proto/lobby.rs"));
} 