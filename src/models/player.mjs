import crypto from 'crypto';

export class Player {
    constructor({ name, teamName = '', words = [], votes = 0, isAdmin = false }) {
        this.id = crypto.randomUUID();
        this.token = crypto.randomUUID();
        this.name = name;
        this.teamName = teamName;
        this.words = words;
        this.isAdmin = isAdmin;
        this.votes = votes;
        this.penaltyPoints = 0;
    }
}

export const player = {
    id: '',
    token: '',
    name: '',
    words: [],
    isAdmin: false,
    teamName: '',
    votes: 0,
    penaltyPoints: 0
};
