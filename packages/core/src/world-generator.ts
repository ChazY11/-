import type { Game, ScriptPack, WorldState, RoleAssignment, RoleDef } from './types';
import { createId } from './id';

/**
 * Generate candidate world states based on current game information.
 * This is an MVP brute-force approach that generates possible role assignments
 * and scores them against observed events.
 */
export function generateWorlds(game: Game, scriptPack: ScriptPack, maxResults: number = 50): WorldState[] {
  if (game.players.length === 0) return [];

  const playerCount = game.players.length;
  const townsfolkCount = scriptPack.townsfolkCount(playerCount);
  const outsiderCount = scriptPack.outsiderCount(playerCount);
  const minionCount = scriptPack.minionCount(playerCount);
  const demonCount = scriptPack.demonCount(playerCount);

  // Also consider baron modification: +2 outsider, -2 townsfolk
  const distributions = [
    { townsfolk: townsfolkCount, outsider: outsiderCount, minion: minionCount, demon: demonCount, hasBaron: false },
  ];

  // If baron is in the script, add baron-modified distribution
  const hasBaronInScript = scriptPack.roles.some(r => r.id === 'baron');
  if (hasBaronInScript && minionCount >= 1) {
    distributions.push({
      townsfolk: Math.max(0, townsfolkCount - 2),
      outsider: outsiderCount + 2,
      minion: minionCount,
      demon: demonCount,
      hasBaron: true,
    });
  }

  const allWorlds: WorldState[] = [];

  for (const dist of distributions) {
    const worlds = generateForDistribution(game, scriptPack, dist, maxResults);
    allWorlds.push(...worlds);
  }

  // Score and sort
  allWorlds.sort((a, b) => b.score - a.score);

  return allWorlds.slice(0, maxResults);
}

interface Distribution {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
  hasBaron: boolean;
}

function generateForDistribution(
  game: Game,
  scriptPack: ScriptPack,
  dist: Distribution,
  maxResults: number,
): WorldState[] {
  const townsfolk = scriptPack.roles.filter(r => r.type === 'townsfolk');
  const outsiders = scriptPack.roles.filter(r => r.type === 'outsider');
  const minions = scriptPack.roles.filter(r => r.type === 'minion');
  const demons = scriptPack.roles.filter(r => r.type === 'demon');

  // For MVP, use a sampling approach rather than full enumeration
  const worlds: WorldState[] = [];
  const attempts = Math.min(maxResults * 20, 2000); // limit attempts

  for (let i = 0; i < attempts && worlds.length < maxResults; i++) {
    const assignment = tryGenerateAssignment(
      game, scriptPack, dist, townsfolk, outsiders, minions, demons,
    );
    if (assignment) {
      worlds.push(assignment);
    }
  }

  return worlds;
}

function tryGenerateAssignment(
  game: Game,
  scriptPack: ScriptPack,
  dist: Distribution,
  townsfolk: RoleDef[],
  outsiders: RoleDef[],
  minions: RoleDef[],
  demons: RoleDef[],
): WorldState | null {
  const players = game.players;

  // If baron distribution, ensure baron is one of the minions
  let selectedMinions: RoleDef[];
  if (dist.hasBaron) {
    const baron = minions.find(r => r.id === 'baron')!;
    const otherMinions = shuffle(minions.filter(r => r.id !== 'baron'));
    selectedMinions = [baron, ...otherMinions.slice(0, dist.minion - 1)];
  } else {
    selectedMinions = shuffle(minions).slice(0, dist.minion);
  }

  const selectedDemons = shuffle(demons).slice(0, dist.demon);
  const selectedTownsfolk = shuffle(townsfolk).slice(0, dist.townsfolk);
  const selectedOutsiders = shuffle(outsiders).slice(0, dist.outsider);

  const allRoles = [
    ...selectedTownsfolk,
    ...selectedOutsiders,
    ...selectedMinions,
    ...selectedDemons,
  ];

  if (allRoles.length !== players.length) return null;

  // Shuffle roles and assign to players
  const shuffledRoles = shuffle(allRoles);
  const assignments: RoleAssignment[] = players.map((player, i) => ({
    playerId: player.id,
    roleId: shuffledRoles[i].id,
    alignment: shuffledRoles[i].alignment,
  }));

  // Score this world
  const { score, reasons, isValid, invalidReasons } = scoreWorld(assignments, game, scriptPack);

  return {
    id: createId('world'),
    assignments,
    isValid,
    invalidReasons,
    score,
    keyDeductions: reasons,
  };
}

function scoreWorld(
  assignments: RoleAssignment[],
  game: Game,
  scriptPack: ScriptPack,
): { score: number; reasons: string[]; isValid: boolean; invalidReasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const invalidReasons: string[] = [];
  let isValid = true;

  // 1. Check against role claims (big bonus if matches)
  for (const player of game.players) {
    if (!player.claimedRole) continue;
    const assignment = assignments.find(a => a.playerId === player.id);
    if (!assignment) continue;

    if (assignment.roleId === player.claimedRole) {
      score += 10;
      const role = scriptPack.roles.find(r => r.id === assignment.roleId);
      reasons.push(`${player.name} 声称是 ${role?.zhName}，分配一致`);
    }
  }

  // 2. Check demon/night death consistency
  const nightDeathEvents = game.events.filter(e => e.type === 'night_death');
  for (const event of nightDeathEvents) {
    const diedPlayerId = event.data.diedPlayerId || event.targetPlayerId;
    if (!diedPlayerId) continue;
    const diedAssignment = assignments.find(a => a.playerId === diedPlayerId);
    if (diedAssignment) {
      // Soldiers shouldn't die from demon
      if (diedAssignment.roleId === 'soldier') {
        score -= 20;
        invalidReasons.push(`士兵不应在夜晚被恶魔杀死`);
        isValid = false;
      }
    }
  }

  // 3. Check execution events - saint execution means evil wins
  const executionEvents = game.events.filter(e => e.type === 'execution');
  for (const event of executionEvents) {
    const diedPlayerId = event.data.diedPlayerId || event.targetPlayerId;
    if (!diedPlayerId) continue;
    const diedAssignment = assignments.find(a => a.playerId === diedPlayerId);
    if (diedAssignment && diedAssignment.roleId === 'saint') {
      // Saint execution is technically valid but notable
      reasons.push('圣徒被处决 → 邪恶获胜');
    }
  }

  // 4. Check drunk assignment - drunk should think they're a townsfolk
  const drunkAssignment = assignments.find(a => a.roleId === 'drunk');
  if (drunkAssignment) {
    const player = game.players.find(p => p.id === drunkAssignment.playerId);
    if (player?.claimedRole) {
      const claimedRoleDef = scriptPack.roles.find(r => r.id === player.claimedRole);
      if (claimedRoleDef?.type === 'townsfolk') {
        score += 5;
        reasons.push(`${player.name} 可能是酒鬼（声称 ${claimedRoleDef.zhName}）`);
      }
    }
  }

  // 5. Evil player suspicion alignment bonus
  for (const assignment of assignments) {
    const player = game.players.find(p => p.id === assignment.playerId);
    if (!player) continue;

    if (assignment.alignment === 'evil' && player.suspicion === 'evil') {
      score += 3;
    } else if (assignment.alignment === 'evil' && player.suspicion === 'trusted') {
      score -= 2;
    } else if (assignment.alignment === 'good' && player.suspicion === 'evil') {
      score -= 2;
    }
  }

  return { score, reasons, isValid, invalidReasons };
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
