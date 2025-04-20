import { makeAutoObservable } from "mobx";

export class Timer {
    timeLeft: number = 120;
    private intervalId: number | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    startTimer() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
        }
        this.timeLeft = 120;
        this.intervalId = window.setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft -= 1;
            } else if (this.intervalId) {
                window.clearInterval(this.intervalId);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
        }
    }
}
