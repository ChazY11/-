/**
 * Calculate suspicion scores for all players based on events and claims.
 */
export function calculateSuspicion(game, scriptPack) {
    return game.players.map(player => {
        let evilProbability = 0.5; // Start neutral
        const reasons = [];
        // Factor 1: Manual suspicion setting
        switch (player.suspicion) {
            case 'trusted':
                evilProbability -= 0.2;
                reasons.push('你标记为可信');
                break;
            case 'suspicious':
                evilProbability += 0.15;
                reasons.push('你标记为可疑');
                break;
            case 'evil':
                evilProbability += 0.3;
                reasons.push('你标记为邪恶');
                break;
        }
        // Factor 2: Role claim analysis
        if (player.claimedRole) {
            const role = scriptPack.roles.find(r => r.id === player.claimedRole);
            if (role) {
                if (role.type === 'townsfolk' || role.type === 'outsider') {
                    // Claiming good role - slight decrease
                    evilProbability -= 0.05;
                }
                // Check if multiple people claim the same role
                const sameClaimCount = game.players.filter(p => p.claimedRole === player.claimedRole).length;
                if (sameClaimCount > 1) {
                    evilProbability += 0.15;
                    reasons.push(`${sameClaimCount} 人声称同一角色`);
                }
            }
        }
        else {
            // No claim is slightly suspicious
            evilProbability += 0.05;
            reasons.push('未声明角色');
        }
        // Factor 3: Death pattern
        if (!player.isAlive) {
            const wasExecuted = game.events.some(e => e.type === 'execution' && (e.data.diedPlayerId === player.id || e.targetPlayerId === player.id));
            const diedAtNight = game.events.some(e => e.type === 'night_death' && (e.data.diedPlayerId === player.id || e.targetPlayerId === player.id));
            if (diedAtNight) {
                evilProbability -= 0.2;
                reasons.push('夜晚死亡（多半善良）');
            }
            if (wasExecuted) {
                // Neutral - could be either side
                reasons.push('被处决');
            }
        }
        // Clamp to [0, 1]
        evilProbability = Math.max(0, Math.min(1, evilProbability));
        return {
            playerId: player.id,
            evilProbability,
            reasons,
        };
    });
}
//# sourceMappingURL=suspicion.js.map