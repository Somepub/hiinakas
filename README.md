# Hiinakas

Hiinakas is a card game that is played with 2-4 players (currently only 1vs1).

# Plans

- [ ] Add 3-4 player support
- [ ] Add more card types
- [ ] Better game UI
- [ ] Add BOTS

# Development

To run the server, run `cargo run hiinakas-server` in the `hiinakas-server` directory.

To run the web client, run `npm install` in the `hiinakas-web` directory and then run `npm run dev`.

# How to play

A three-phase card game: play hand cards, then face-up cards, and finally hidden cards. Win through strategy and timing.

Finding a Game

    Press the "Find Match" button to enter matchmaking
    System will automatically pair you with another player
    Once matched, the game starts immediately

Turn Timer

    Each player has 3 minutes for their entire game
    Timer counts down only during your turn
    If your timer runs out during your turn, you lose the game
    Timer pauses when it's opponent's turn

Initial Setup

Each player receives:

    3 cards in hand (drawn from deck)
    3 cards face-up on the table (your floor cards)
    3 cards face-down (your hidden cards) The game proceeds in turns, with players taking actions one at a time.

Game Progression

    Start by playing cards from your hand
        Continue until deck is empty

    Once deck is empty:
        Play remaining hand cards
        Then play your 3 face-up floor cards

    After floor cards:
        Reveal and play hidden cards one at a time
        Cannot see hidden cards until played

    Victory:
        Win by being first to play all cards
        Win if opponent's timer runs out during their turn
        Must clear hand, floor, and hidden cards

Card Types
Regular Cards

Play these cards on equal or lower value cards:

    Number Cards: 3, 4, 5, 6, 9
    Face Cards: Jack, Queen, King, Ace

Magic Cards

    2: Can be placed on 2, 7, 8 (if below card is 2, 7 or ACE) or ACE
    7: Can be played on any card. Next player must play a card lower than 7 or any magic card
    8: Can be played on any card. Acts as a transparent card - next player must beat the card under it
    10: Can be played on any card. Clears the table, allowing any card to be played next

Turn Structure

    Play a Card
        Play a valid card from your hand
        If hand is empty and deck is empty, play from floor cards
        If floor cards are empty, play one random hidden card
        Or pick up all cards from the table if you can't play

    End Turn
        Can only end turn after playing a card
        If you have less than 3 cards in hand and deck has cards, draw up to 3
        No drawing occurs when deck is empty

Special Rules

    Must always try to play a card if possible
    Picking up cards is only allowed when no valid play exists
    The deck contains 52 standard playing cards
    Floor cards become playable only after the deck is empty
    Hidden cards become playable only after floor cards are gone
    Hidden cards are revealed one at a time randomly when played
    Game continues until someone wins by playing all their cards or time runs out
