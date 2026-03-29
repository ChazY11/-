import type { Game, ScriptPack, ValidationIssue } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Run all validation rules against the current game state.
 * Returns a list of issues sorted by severity (errors first).
 */
export function validateGame(game: Game, scriptPack: ScriptPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Run script-pack-specific rules first (they handle script-specific checks)
  const scriptRuleIds = new Set(scriptPack.validationRules.map(r => r.id));
  for (const rule of scriptPack.validationRules) {
    issues.push(...rule.validate(game, scriptPack));
  }

  // Run built-in generic rules (skip if script pack already covers them)
  if (!scriptRuleIds.has('tb_no_duplicate_claims')) {
    issues.push(...checkDuplicateRoleClaims(game, scriptPack));
  }
  if (!scriptRuleIds.has('tb_role_claim_count')) {
    issues.push(...checkRoleClaimCounts(game, scriptPack));
  }
  if (!scriptRuleIds.has('tb_conflicting_empath')) {
    issues.push(...checkEmpathConflicts(game, scriptPack));
  }
  if (!scriptRuleIds.has('tb_dead_night_ability')) {
    issues.push(...checkDeadPlayerClaims(game, scriptPack));
  }
  issues.push(...checkPlayerCount(game, scriptPack));
  issues.push(...checkExecutionConsistency(game));

  // Sort: errors > warnings > info
  const severityOrder = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}

/** Check for duplicate role claims among living players */
function checkDuplicateRoleClaims(game: Game, scriptPack: ScriptPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const claimMap = new Map<string, string[]>(); // roleId -> playerIds

  for (const player of game.players) {
    if (player.claimedRole) {
      const existing = claimMap.get(player.claimedRole) || [];
      existing.push(player.id);
      claimMap.set(player.claimedRole, existing);
    }
  }

  for (const [roleId, playerIds] of claimMap.entries()) {
    if (playerIds.length > 1) {
      const role = scriptPack.roles.find(r => r.id === roleId);
      issues.push({
        id: uuidv4(),
        severity: 'error',
        title: '唯一身份冲突',
        message: `多人声称自己是${role?.zhName ?? roleId}：共 ${playerIds.length} 人`,
        impact: '相关世界线可信度大幅降低，至少一人在说谎',
        involvedPlayerIds: playerIds,
        involvedEventIds: [],
        ruleId: 'duplicate_role_claim',
      });
    }
  }

  return issues;
}

/** Check if claimed role distribution matches expected */
function checkRoleClaimCounts(game: Game, scriptPack: ScriptPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const claimedRoles = game.players
    .filter(p => p.claimedRole)
    .map(p => scriptPack.roles.find(r => r.id === p.claimedRole))
    .filter(Boolean);

  const typeCounts: Record<string, number> = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
  for (const role of claimedRoles) {
    if (role) typeCounts[role.type] = (typeCounts[role.type] ?? 0) + 1;
  }

  const expectedTownsfolk = scriptPack.townsfolkCount(game.playerCount);
  const expectedOutsider = scriptPack.outsiderCount(game.playerCount);

  // Check if too many townsfolk claims
  if (typeCounts.townsfolk > expectedTownsfolk) {
    issues.push({
      id: uuidv4(),
      severity: 'warning',
      title: '镇民声称过多',
      message: `镇民声称人数 (${typeCounts.townsfolk}) 超过预期 (${expectedTownsfolk})`,
      impact: '可能存在邪恶玩家冒充镇民',
      involvedPlayerIds: [],
      involvedEventIds: [],
      ruleId: 'townsfolk_overcount',
    });
  }

  // Check outsider claims
  if (typeCounts.outsider > expectedOutsider + 2) { // +2 for baron possibility
    issues.push({
      id: uuidv4(),
      severity: 'warning',
      title: '外来者声称异常',
      message: `外来者声称人数 (${typeCounts.outsider}) 异常多（预期 ${expectedOutsider}，男爵最多 +2）`,
      impact: '若无男爵，则可能有人冒充外来者',
      involvedPlayerIds: [],
      involvedEventIds: [],
      ruleId: 'outsider_overcount',
    });
  }

  return issues;
}

/** Check for conflicting empath information */
function checkEmpathConflicts(game: Game, scriptPack: ScriptPack): ValidationIssue[] {
  void scriptPack;
  const issues: ValidationIssue[] = [];

  // Find all empath claim_info events
  const empathEvents = game.events.filter(
    e => e.type === 'claim_info' && e.sourcePlayerId
  );

  // Find the empath claimer
  const empathPlayer = game.players.find(p => p.claimedRole === 'empath');
  if (!empathPlayer) return issues;

  const empathInfoEvents = empathEvents.filter(e => e.sourcePlayerId === empathPlayer.id);

  // Check for conflicting numbers across nights
  const infoByNight = new Map<number, typeof empathInfoEvents>();
  for (const event of empathInfoEvents) {
    const existing = infoByNight.get(event.day) || [];
    existing.push(event);
    infoByNight.set(event.day, existing);
  }

  for (const [night, events] of infoByNight) {
    if (events.length > 1) {
      issues.push({
        id: uuidv4(),
        severity: 'warning',
        title: '共情者信息矛盾',
        message: `共情者在第 ${night} 晚提供了多条信息，请检查`,
        impact: '可能原因：说谎、中毒、记录错误',
        involvedPlayerIds: [empathPlayer.id],
        involvedEventIds: events.map(e => e.id),
        ruleId: 'empath_multiple_info',
      });
    }
  }

  return issues;
}

/** Check dead players claiming night abilities */
function checkDeadPlayerClaims(game: Game, _scriptPack: ScriptPack): ValidationIssue[] {
  void _scriptPack;
  const issues: ValidationIssue[] = [];

  for (const event of game.events) {
    if (event.type === 'ability_use' && event.sourcePlayerId) {
      const player = game.players.find(p => p.id === event.sourcePlayerId);
      if (player && !player.isAlive) {
        issues.push({
          id: uuidv4(),
          severity: 'info',
          title: '死亡玩家使用技能',
          message: `已死亡的 ${player.name} (#${player.seatNumber}) 记录了使用技能`,
          impact: '请确认记录是否正确',
          involvedPlayerIds: [player.id],
          involvedEventIds: [event.id],
          ruleId: 'dead_ability_use',
        });
      }
    }
  }

  return issues;
}

/** Check if player count matches expected */
function checkPlayerCount(game: Game, _scriptPack: ScriptPack): ValidationIssue[] {
  void _scriptPack;
  const issues: ValidationIssue[] = [];

  if (game.players.length !== game.playerCount && game.players.length > 0 && game.currentPhase !== 'setup') {
    issues.push({
      id: uuidv4(),
      severity: 'warning',
      title: '玩家人数不匹配',
      message: `当前玩家数 (${game.players.length}) 与设定人数 (${game.playerCount}) 不符`,
      impact: '可能影响角色分配计算',
      involvedPlayerIds: [],
      involvedEventIds: [],
      ruleId: 'player_count_mismatch',
    });
  }

  return issues;
}

/** Check execution consistency - can't execute multiple per day */
function checkExecutionConsistency(game: Game): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const executionsByDay = new Map<number, string[]>();

  for (const event of game.events) {
    if (event.type === 'execution') {
      const day = event.day;
      const existing = executionsByDay.get(day) || [];
      existing.push(event.id);
      executionsByDay.set(day, existing);
    }
  }

  for (const [day, eventIds] of executionsByDay) {
    if (eventIds.length > 1) {
      issues.push({
        id: uuidv4(),
        severity: 'error',
        title: '重复处决',
        message: `第 ${day} 天记录了 ${eventIds.length} 次处决，正常只能有 1 次`,
        impact: '每天只能有一次处决，请检查记录',
        involvedPlayerIds: [],
        involvedEventIds: eventIds,
        ruleId: 'multiple_executions',
      });
    }
  }

  return issues;
}
