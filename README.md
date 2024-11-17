# Hiinakas

A multiplayer card game that unfolds in three phases. Begin with your hand cards, progress to your face-up cards once the deck empties, and finally face the challenge of your hidden cards. Strategic play and timing are key to victory.

## Reference/Demo

https://hiinakas.com

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

<details>
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

<details>
<summary><h2 style="display:inline-block;">Game</h2></summary>

### Initial Setup
Each player receives:
- 3 cards in hand (drawn from deck)
- 3 cards face-up on the table (your floor cards)
- 3 cards face-down (your hidden cards)
The game proceeds in turns, with players taking actions one at a time.

### Game Progression
1. Start by playing cards from your hand
   - Continue until deck is empty

2. Once deck is empty:
   - Play remaining hand cards
   - Then play your 3 face-up floor cards

3. After floor cards:
   - Reveal and play hidden cards one at a time
   - Cannot see hidden cards until played

4. Victory:
   - Win by being first to play all cards
   - Must clear hand, floor, and hidden cards

### Card Types
#### Regular Cards
Play these cards on equal or lower value cards:
- Number Cards: 3, 4, 5, 6, 9
- Face Cards: Jack, Queen, King, Ace

#### Magic Cards
- **2**: Can be played on any card
- **7**: Can be played on any card. Next player must play a card lower than 7 or any magic card
- **8**: Can be played on any card. Acts as a transparent card - next player must beat the card under it
- **10**: Can be played on any card. Clears the table, allowing any card to be played next

### Turn Structure
1. **Play a Card**
   - Play a valid card from your hand
   - If hand is empty and deck is empty, play from floor cards
   - If floor cards are empty, play one random hidden card
   - Or pick up all cards from the table if you can't play

2. **End Turn**
   - Can only end turn after playing a card
   - If you have less than 3 cards in hand and deck has cards, draw up to 3
   - No drawing occurs when deck is empty

### Special Rules
- Must always try to play a card if possible
- Picking up cards is only allowed when no valid play exists
- The deck contains 52 standard playing cards
- Floor cards become playable only after the deck is empty
- Hidden cards become playable only after floor cards are gone
- Hidden cards are revealed one at a time randomly when played
- Game continues until someone wins by playing all their cards

</details>

## Development

<details>
<summary><h2 style="display:inline-block;">Technical Details</h2></summary>

### Stack
- Frontend: React/TypeScript
- Backend: Node.js
- Real-time communication: Socket.IO

</details>

<details>
<summary><h2 style="display:inline-block;">TODO</h2></summary>

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
- [ ] **hiinakas-web:** Better reusable components

### Backend Tasks
- [ ] **hiinakas-server:** Rewrite in Rust
- [ ] **hiinakas-server:** Add more detailed analytics
- [ ] **hiinakas-server:** Add more detailed monitoring

### Infrastructure Tasks
- [ ] Add CI/CD pipeline
- [ ] Add more detailed documentation

</details>



## License
MIT
