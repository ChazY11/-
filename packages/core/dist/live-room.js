import { createId } from './id';
export function generateInviteCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
export function createLiveMemberState() {
    return {
        isAlive: true,
        poisoned: false,
        disabled: false,
        statusTags: [],
    };
}
export function createLiveRoom(input) {
    var _a;
    const now = Date.now();
    const storytellerMemberId = createId('member');
    const roomId = createId('room');
    return {
        roomId,
        inviteCode: generateInviteCode(),
        hostId: input.storytellerUserId,
        storytellerId: storytellerMemberId,
        mode: (_a = input.mode) !== null && _a !== void 0 ? _a : 'live',
        scriptId: input.scriptId,
        scriptName: input.scriptName,
        playerCount: input.playerCount,
        status: 'open',
        currentPhase: 'lobby',
        currentDay: 0,
        currentNight: 0,
        members: [
            {
                memberId: storytellerMemberId,
                userId: input.storytellerUserId,
                name: input.storytellerName,
                role: 'storyteller',
                ready: true,
                connected: true,
                joinedAt: now,
                lastSeenAt: now,
                liveState: createLiveMemberState(),
            },
        ],
        seats: Array.from({ length: input.playerCount }, (_, index) => ({
            seatNumber: index + 1,
        })),
        logs: [
            {
                logId: createId('roomlog'),
                roomId,
                eventType: 'room_created',
                summary: `${input.storytellerName} 创建了房间`,
                visibility: 'public',
                createdAt: now,
            },
        ],
        identityDeliveries: {},
        nightRequests: [],
        createdAt: now,
        updatedAt: now,
    };
}
export function createNightActionRequest(input) {
    const now = Date.now();
    return {
        requestId: createId('nightreq'),
        roomId: input.roomId,
        phase: 'night',
        nightNumber: input.nightNumber,
        actorMemberId: input.actorMemberId,
        actorPlayerName: input.actorPlayerName,
        actorRoleId: input.actorRoleId,
        actionType: input.actionType,
        prompt: input.prompt,
        description: input.description,
        options: input.options,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };
}
//# sourceMappingURL=live-room.js.map