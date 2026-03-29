import { v4 as uuidv4 } from 'uuid';
import {
  RoleDef,
  ScriptPack,
  ValidationRule,
  ValidationIssue,
  Game,
} from '../types';

// ============ Townsfolk (13) ============

const washerwoman: RoleDef = {
  id: 'washerwoman',
  name: 'washerwoman',
  zhName: '洗衣妇',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个夜晚，你会得知两名玩家和一个镇民角色：这两名玩家之一是该角色',
  nightOrder: 1,
  firstNight: true,
  otherNights: false,
};

const librarian: RoleDef = {
  id: 'librarian',
  name: 'librarian',
  zhName: '图书管理员',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个夜晚，你会得知两名玩家和一个外来者角色：这两名玩家之一是该角色。（或者你会得知没有外来者在场）',
  nightOrder: 2,
  firstNight: true,
  otherNights: false,
};

const investigator: RoleDef = {
  id: 'investigator',
  name: 'investigator',
  zhName: '调查员',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个夜晚，你会得知两名玩家和一个爪牙角色：这两名玩家之一是该角色。（或者你会得知没有爪牙在场）',
  nightOrder: 3,
  firstNight: true,
  otherNights: false,
};

const chef: RoleDef = {
  id: 'chef',
  name: 'chef',
  zhName: '厨师',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个夜晚，你会得知场上邻座的邪恶玩家有多少对',
  nightOrder: 4,
  firstNight: true,
  otherNights: false,
};

const empath: RoleDef = {
  id: 'empath',
  name: 'empath',
  zhName: '共情者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚，你会得知与你邻近的两名存活的玩家中邪恶玩家的数量',
  nightOrder: 5,
  firstNight: true,
  otherNights: true,
};

const fortuneTeller: RoleDef = {
  id: 'fortune_teller',
  name: 'fortune_teller',
  zhName: '占卜师',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚，你要选择两名玩家：你会得知他们之中是否有恶魔。会有一名善良玩家始终被你的能力当作"恶魔"（干扰项）',
  nightOrder: 6,
  firstNight: true,
  otherNights: true,
};

const undertaker: RoleDef = {
  id: 'undertaker',
  name: 'undertaker',
  zhName: '送葬者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚*，你会得知今天白天死于处决的玩家的角色',
  nightOrder: 7,
  firstNight: false,
  otherNights: true,
};

const monk: RoleDef = {
  id: 'monk',
  name: 'monk',
  zhName: '僧侣',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚*，你要选择除你以外的一名玩家：当晚恶魔的负面能力对他无效',
  nightOrder: 8,
  firstNight: false,
  otherNights: true,
};

const ravenkeeper: RoleDef = {
  id: 'ravenkeeper',
  name: 'ravenkeeper',
  zhName: '守鸦人',
  type: 'townsfolk',
  alignment: 'good',
  ability: '如果你在夜晚死亡，你要选择一名玩家：你会得知他的角色',
  nightOrder: 9,
  firstNight: false,
  otherNights: true,
};

const virgin: RoleDef = {
  id: 'virgin',
  name: 'virgin',
  zhName: '贞洁者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '当你首次被提名时，如果提名你的玩家是镇民，他立刻被处决',
};

const slayer: RoleDef = {
  id: 'slayer',
  name: 'slayer',
  zhName: '猎手',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每局游戏限一次，你可以在白天时公开选择一名玩家，如果他是恶魔，他死亡',
};

const soldier: RoleDef = {
  id: 'soldier',
  name: 'soldier',
  zhName: '士兵',
  type: 'townsfolk',
  alignment: 'good',
  ability: '恶魔的负面能力对你无效',
};

const mayor: RoleDef = {
  id: 'mayor',
  name: 'mayor',
  zhName: '镇长',
  type: 'townsfolk',
  alignment: 'good',
  ability: '如果只有三名玩家存活且白天没有人被处决，你的阵营获胜（镇长日）。如果你在夜晚即将死亡，可能会有一名其他玩家代替你死亡',
};

// ============ Outsiders (4) ============

const butler: RoleDef = {
  id: 'butler',
  name: 'butler',
  zhName: '管家',
  type: 'outsider',
  alignment: 'good',
  ability: '每个夜晚，你要选择（除你以外的）一名玩家（主人）：明天白天，只有他投票时你才能投票',
  nightOrder: 10,
  firstNight: true,
  otherNights: true,
};

const drunk: RoleDef = {
  id: 'drunk',
  name: 'drunk',
  zhName: '酒鬼',
  type: 'outsider',
  alignment: 'good',
  ability: '你不知道你是酒鬼。你以为你是一个镇民角色，但其实你不是。（不会有玩家直接获得酒鬼，会替换为一个镇民角色代替）',
  setup: true,
};

const recluse: RoleDef = {
  id: 'recluse',
  name: 'recluse',
  zhName: '隐士',
  type: 'outsider',
  alignment: 'good',
  ability: '你可能会被当作邪恶阵营、爪牙角色或恶魔角色（千人千面），即使你已死亡',
};

const saint: RoleDef = {
  id: 'saint',
  name: 'saint',
  zhName: '圣徒',
  type: 'outsider',
  alignment: 'good',
  ability: '如果你死于处决，你的阵营落败',
};

// ============ Minions (4) ============

const poisoner: RoleDef = {
  id: 'poisoner',
  name: 'poisoner',
  zhName: '投毒者',
  type: 'minion',
  alignment: 'evil',
  ability: '每个夜晚，你要选择一名玩家：他在当晚和明天白天中毒',
  nightOrder: 1,
  firstNight: true,
  otherNights: true,
};

const spy: RoleDef = {
  id: 'spy',
  name: 'spy',
  zhName: '间谍',
  type: 'minion',
  alignment: 'evil',
  ability: '每个夜晚，你都能查看魔典。你可能会被当作善良阵营、镇民角色或外来者角色（千人千面），即使你已死亡',
  nightOrder: 2,
  firstNight: true,
  otherNights: true,
};

const baron: RoleDef = {
  id: 'baron',
  name: 'baron',
  zhName: '男爵',
  type: 'minion',
  alignment: 'evil',
  ability: '会有额外的外来者在场。[+2外来者]（在游戏开始前便会+2外来者，相对地会-2镇民）',
  setup: true,
};

const scarletWoman: RoleDef = {
  id: 'scarlet_woman',
  name: 'scarlet_woman',
  zhName: '红唇女郎',
  type: 'minion',
  alignment: 'evil',
  ability: '如果大于等于五名玩家存活时（旅行者不计算在内），恶魔死亡，你变成新一个恶魔',
};

// ============ Demons (1) ============

const imp: RoleDef = {
  id: 'imp',
  name: 'imp',
  zhName: '小恶魔',
  type: 'demon',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家：他死亡。如果你以这种方式自杀，一名爪牙会变成小恶魔',
  nightOrder: 3,
  firstNight: false,
  otherNights: true,
};

// ============ Travelers (5) ============

const thief: RoleDef = {
  id: 'thief',
  name: 'thief',
  zhName: '窃贼',
  type: 'traveler',
  alignment: 'good',
  ability: '每个夜晚，你要选择除你以外的一名玩家：明天白天他的投票会被算作负数',
  nightOrder: 11,
  firstNight: true,
  otherNights: true,
};

const bureaucrat: RoleDef = {
  id: 'bureaucrat',
  name: 'bureaucrat',
  zhName: '官员',
  type: 'traveler',
  alignment: 'good',
  ability: '每个夜晚，你要选择除你以外的一名玩家：明天白天，他的投票算作三票',
  nightOrder: 12,
  firstNight: true,
  otherNights: true,
};

const gunslinger: RoleDef = {
  id: 'gunslinger',
  name: 'gunslinger',
  zhName: '枪手',
  type: 'traveler',
  alignment: 'good',
  ability: '每个白天，当首次投票被统计后，你可以选择一名刚投过票的玩家：他死亡',
};

const scapegoat: RoleDef = {
  id: 'scapegoat',
  name: 'scapegoat',
  zhName: '替罪羊',
  type: 'traveler',
  alignment: 'good',
  ability: '如果你的阵营的一名玩家被处决，你可能会代替他被处决',
};

const beggar: RoleDef = {
  id: 'beggar',
  name: 'beggar',
  zhName: '乞丐',
  type: 'traveler',
  alignment: 'good',
  ability: '你只能使用投票标记才能投票。死亡的玩家可以将他的投票标记给你，如果他这么做，你会得知他的阵营。你不会中毒和醉酒',
};

// ============ All Roles ============

const allRoles: RoleDef[] = [
  // Townsfolk
  washerwoman,
  librarian,
  investigator,
  chef,
  empath,
  fortuneTeller,
  undertaker,
  monk,
  ravenkeeper,
  virgin,
  slayer,
  soldier,
  mayor,
  // Outsiders
  butler,
  drunk,
  recluse,
  saint,
  // Minions
  poisoner,
  spy,
  baron,
  scarletWoman,
  // Demons
  imp,
];

const travelerRoles: RoleDef[] = [
  thief,
  bureaucrat,
  gunslinger,
  scapegoat,
  beggar,
];

// ============ Player Count Distribution ============

/**
 * Trouble Brewing player count distribution:
 *  5: 3T 0O 1M 1D
 *  6: 3T 1O 1M 1D
 *  7: 5T 0O 1M 1D
 *  8: 5T 1O 1M 1D
 *  9: 5T 2O 1M 1D
 * 10: 7T 0O 2M 1D
 * 11: 7T 1O 2M 1D
 * 12: 7T 2O 2M 1D
 * 13: 9T 0O 3M 1D
 * 14: 9T 1O 3M 1D
 * 15: 9T 2O 3M 1D
 */

const distributionTable: Record<number, [number, number, number, number]> = {
  5:  [3, 0, 1, 1],
  6:  [3, 1, 1, 1],
  7:  [5, 0, 1, 1],
  8:  [5, 1, 1, 1],
  9:  [5, 2, 1, 1],
  10: [7, 0, 2, 1],
  11: [7, 1, 2, 1],
  12: [7, 2, 2, 1],
  13: [9, 0, 3, 1],
  14: [9, 1, 3, 1],
  15: [9, 2, 3, 1],
};

function getDistribution(playerCount: number): [number, number, number, number] {
  const clamped = Math.max(5, Math.min(15, playerCount));
  return distributionTable[clamped] ?? distributionTable[5];
}

function townsfolkCount(playerCount: number): number {
  return getDistribution(playerCount)[0];
}

function outsiderCount(playerCount: number): number {
  return getDistribution(playerCount)[1];
}

function minionCount(playerCount: number): number {
  return getDistribution(playerCount)[2];
}

function demonCount(playerCount: number): number {
  return getDistribution(playerCount)[3];
}

// ============ Validation Rules ============

const noDuplicateRoleClaims: ValidationRule = {
  id: 'tb_no_duplicate_claims',
  description: '不允许重复声称同一角色',
  validate: (game: Game, _scriptPack: ScriptPack): ValidationIssue[] => {
    void _scriptPack;
    const issues: ValidationIssue[] = [];
    const claimedRoles = new Map<string, string[]>();

    for (const player of game.players) {
      if (player.claimedRole) {
        const existing = claimedRoles.get(player.claimedRole) ?? [];
        existing.push(player.id);
        claimedRoles.set(player.claimedRole, existing);
      }
    }

    for (const [roleId, playerIds] of claimedRoles.entries()) {
      if (playerIds.length > 1) {
        const role = allRoles.find((r) => r.id === roleId);
        const roleName = role ? role.zhName : roleId;
        issues.push({
          id: uuidv4(),
          severity: 'error',
          title: '唯一身份冲突',
          message: `多名玩家声称自己是${roleName}`,
          impact: '当前脚本中该身份只能存在1个，至少一人在说谎',
          involvedPlayerIds: playerIds,
          involvedEventIds: [],
          ruleId: 'tb_no_duplicate_claims',
        });
      }
    }

    return issues;
  },
};

const roleClaimCountCheck: ValidationRule = {
  id: 'tb_role_claim_count',
  description: '声称角色数量与预期角色分配数量的对比检查',
  validate: (game: Game, scriptPack: ScriptPack): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    const claimedByType: Record<string, number> = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
    for (const player of game.players) {
      if (player.claimedRole) {
        const role = scriptPack.roles.find((r) => r.id === player.claimedRole);
        if (role) {
          claimedByType[role.type] = (claimedByType[role.type] ?? 0) + 1;
        }
      }
    }

    const expectedTownsfolk = scriptPack.townsfolkCount(game.playerCount);
    const expectedOutsiders = scriptPack.outsiderCount(game.playerCount);

    if (claimedByType.townsfolk > expectedTownsfolk) {
      issues.push({
        id: uuidv4(),
        severity: 'warning',
        title: '镇民声称过多',
        message: `声称镇民角色的玩家数(${claimedByType.townsfolk})超过预期数量(${expectedTownsfolk})`,
        impact: '可能存在邪恶玩家冒充镇民',
        involvedPlayerIds: [],
        involvedEventIds: [],
        ruleId: 'tb_role_claim_count',
      });
    }

    if (claimedByType.outsider > expectedOutsiders) {
      issues.push({
        id: uuidv4(),
        severity: 'warning',
        title: '外来者声称异常',
        message: `声称外来者角色的玩家数(${claimedByType.outsider})超过预期数量(${expectedOutsiders})`,
        impact: '若无男爵在场，则可能有人冒充外来者',
        involvedPlayerIds: [],
        involvedEventIds: [],
        ruleId: 'tb_role_claim_count',
      });
    }

    return issues;
  },
};

const conflictingEmpathInfo: ValidationRule = {
  id: 'tb_conflicting_empath',
  description: '检测共情者信息中的矛盾',
  validate: (game: Game, _scriptPack: ScriptPack): ValidationIssue[] => {
    void _scriptPack;
    const issues: ValidationIssue[] = [];

    // Find empath claim events grouped by night
    const empathEvents = game.events.filter(
      (e) =>
        e.type === 'claim_info' &&
        e.data.roleId === 'empath' &&
        e.data.claimedNumber !== undefined,
    );

    const byNight = new Map<number, typeof empathEvents>();
    for (const event of empathEvents) {
      const existing = byNight.get(event.day) ?? [];
      existing.push(event);
      byNight.set(event.day, existing);
    }

    for (const [night, events] of byNight.entries()) {
      if (events.length > 1) {
        const numbers = events.map((e) => e.data.claimedNumber);
        const unique = new Set(numbers);
        if (unique.size > 1) {
          issues.push({
            id: uuidv4(),
            severity: 'warning',
            title: '共情者信息矛盾',
            message: `第${night}夜共情者信息存在矛盾：报告了不同的数字(${[...unique].join(', ')})`,
            impact: '可能原因：说谎、中毒、记录错误',
            involvedPlayerIds: events
              .map((e) => e.sourcePlayerId)
              .filter((id): id is string => id !== undefined),
            involvedEventIds: events.map((e) => e.id),
            ruleId: 'tb_conflicting_empath',
          });
        }
      }
    }

    return issues;
  },
};

const deadPlayerNightAbility: ValidationRule = {
  id: 'tb_dead_night_ability',
  description: '已死亡玩家声称使用夜间能力',
  validate: (game: Game, scriptPack: ScriptPack): ValidationIssue[] => {
    void scriptPack;
    const issues: ValidationIssue[] = [];

    const deadPlayerIds = new Set(
      game.players.filter((p) => !p.isAlive).map((p) => p.id),
    );

    const nightAbilityEvents = game.events.filter(
      (e) => e.type === 'ability_use' && e.phase === 'night' && e.sourcePlayerId,
    );

    for (const event of nightAbilityEvents) {
      if (event.sourcePlayerId && deadPlayerIds.has(event.sourcePlayerId)) {
        const player = game.players.find((p) => p.id === event.sourcePlayerId);
        const playerName = player ? player.name : event.sourcePlayerId;
        issues.push({
          id: uuidv4(),
          severity: 'info',
          title: '死亡玩家使用技能',
          message: `已死亡的玩家${playerName}声称在第${event.day}夜使用了夜间能力`,
          impact: '请确认记录是否正确',
          involvedPlayerIds: [event.sourcePlayerId],
          involvedEventIds: [event.id],
          ruleId: 'tb_dead_night_ability',
        });
      }
    }

    return issues;
  },
};

// ============ Export Script Pack ============

export { travelerRoles };

export const troubleBrewingPack: ScriptPack = {
  id: 'trouble_brewing',
  name: 'Trouble Brewing',
  edition: 'base-1',
  summary: '适合入门的基础脚本，信息角色直观，便于记录和推理。',
  supportedPlayerCounts: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  status: 'stable',
  zhName: '暗流涌动',
  roles: allRoles,
  townsfolkCount,
  outsiderCount,
  minionCount,
  demonCount,
  validationRules: [
    noDuplicateRoleClaims,
    roleClaimCountCheck,
    conflictingEmpathInfo,
    deadPlayerNightAbility,
  ],
};
