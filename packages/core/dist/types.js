import { createId } from './id';
export function createDefaultPlayerState() {
    return {
        poisoned: false,
        drunk: false,
        mad: false,
        protected: false,
        alignmentChanged: false,
        roleChanged: false,
        usedAbility: false,
        nominated: false,
        voted: false,
        executed: false,
        diedAtNight: false,
        customTags: [],
    };
}
export function createDefaultStorytellerData() {
    return {
        roleAssignments: {},
        nightActions: [],
        grimNotes: '',
    };
}
export function createPlayer(seatNumber, name) {
    return {
        id: createId('player'),
        seatNumber,
        name,
        isAlive: true,
        hasGhostVote: true,
        notes: '',
        state: createDefaultPlayerState(),
        suspicion: 'unknown',
        actualAlignment: 'good',
        privateNotes: '',
    };
}
export function createGame(name, scriptId, playerCount, mode = 'good') {
    return {
        id: createId('game'),
        name,
        scriptId,
        playerCount,
        players: [],
        events: [],
        currentPhase: 'setup',
        currentDay: 0,
        currentNight: 0,
        lastActiveAt: Date.now(),
        mode,
        storytellerData: createDefaultStorytellerData(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}
export function createEvent(type, day, phase, data, sourcePlayerId, targetPlayerId) {
    return {
        id: createId('event'),
        type,
        day,
        phase,
        timestamp: Date.now(),
        sourcePlayerId,
        targetPlayerId,
        data,
    };
}
//# sourceMappingURL=types.js.map