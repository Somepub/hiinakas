import { makeAutoObservable } from 'mobx';

export class FloatingTextStore {
    show: boolean = false;
    text: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    showText(text: string) {
        this.text = text;
        this.show = true;
    }

    hideText() {
        this.show = false;
    }
}