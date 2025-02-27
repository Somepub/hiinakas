export interface ZoneBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export class GameZones {
  dropZone: ZoneBounds = null!;
  opponentZone: ZoneBounds = null!;
  deckZone: ZoneBounds = null!;
  tableZone: ZoneBounds = null!;

  setDropZone(state: ZoneBounds) {
    this.dropZone = state;
  }

  setOpponentZone(state: ZoneBounds) {
    this.opponentZone = state;
  }

  setDeckZone(state: ZoneBounds) {
    this.deckZone = state;
  }

  setTableZone(state: ZoneBounds) {
    this.tableZone = state;
  }
} 