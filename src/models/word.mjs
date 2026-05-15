import crypto from 'crypto';

export class BingoWord {
    constructor(label) {
        this.id = crypto.randomUUID();
        this.label = label;
        this.completed = false;
        this.photo = null;
        this.photoPath = null;
        this.photoOrder = Math.random();
        this.votes = 0;
    }
}

export const word = {
    id: '',
    label: '',
    completed: false,
    photo: null,
    photoPath: null,
    photoOrder: 0,
    votes: 0
};
