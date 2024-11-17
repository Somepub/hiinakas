# Hiinakas

A multiplayer card game where strategy meets luck. Play cards wisely, use magic cards to your advantage, and be the first to empty your hand to win!

## How to run

### Source
```bash
npm install
npm run dev
```
OR
```bash
yarn
yarn dev
```

### Docker
```bash
docker compose up
```

To test the game, you can use two separate browsers.

## How to play

<details open>
<summary><h2 style="display:inline-block;">Lobby</h2></summary>

### Creating/Joining a Game
1. Start the game and you'll enter the lobby
2. You can invite other players to join your game
3. Other players can accept your invite to join

### Starting the Game
1. Once all players have joined
2. Everyone needs to mark themselves as ready
3. The host can then start the game

</details>

<details open>
<summary><h2 style="display:inline-block;">Game Rules</h2></summary>

### Basic Rules
- Each player starts with 3 cards
- Players must maintain 3 cards in their hand when possible
- Game is played in turns
- Win condition: Play all your cards when the deck is empty

### Card Types
#### Regular Cards
- 3-6: Must be played on a card of equal or lower value
- 9: Must be played on a card of equal or lower value
- J, Q, K, A: Must be played on a card of equal or lower value

#### Magic Cards
- **2**: Can be played on any card
- **7**: Can be played on any card. Next player must play a card lower than 7 or any magic card
- **8**: Can be played on any card. Acts as a transparent card - next player must beat the card under it
- **10**: Can be played on any card. Clears the table, allowing any card to be played next

### Turn Structure
1. **Play a Card**
   - Play a valid card from your hand
   - Or pick up all cards from the table if you can't play

2. **End Turn**
   - Can only end turn after playing a card
   - If you have less than 3 cards, draw up to 3 (if deck has cards)

### Special Rules
- Must always try to play a card if possible
- Picking up cards is only allowed when no valid play exists
- The deck contains 52 standard playing cards
- Game continues until someone wins by playing all their cards when deck is empty

</details>

## Strategy Tips
- Save magic cards (2, 7, 8, 10) for strategic moments
- Use 10 to clear a difficult table
- Watch your opponents' card count
- Plan ahead when using 7 or 8
- Consider picking up cards strategically even if you can play

## Development

<details open>
<summary><h2 style="display:inline-block;">Technical Details</h2></summary>

### Stack
- Frontend: React/TypeScript
- Backend: Node.js
- Real-time communication: Socket.IO

</details>

## TODO

### Full-Stack Tasks
- [ ] **hiinakas-server & hiinakas-web:** 4 cards reset
- [ ] **hiinakas-server & hiinakas-web:** Add turn timer
- [ ] **hiinakas-server & hiinakas-web:** Add more players to lobby/game
- [ ] **hiinakas-server & hiinakas-web:** Add tests
- [ ] **hiinakas-server & hiinakas-web:** Add more detailed logging
- [ ] **hiinakas-server & hiinakas-web:** Add more detailed info & error handling
- [ ] **hiinakas-server & hiinakas-web:** serviceWorker & notifications
- [ ] **hiinakas-server & hiinakas-web:** Add more card rules

### Frontend Tasks
- [ ] **hiinakas-web:** Menu profile & settings

### Backend Tasks
- [ ] **hiinakas-server:** Migrate to Rust
- [ ] **hiinakas-server:** Add more detailed analytics
- [ ] **hiinakas-server:** Add more detailed monitoring

### Infrastructure Tasks
- [ ] Add CI/CD pipeline
- [ ] Add more detailed documentation

## License
MIT
