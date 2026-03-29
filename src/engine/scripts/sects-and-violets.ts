import { v4 as uuidv4 } from 'uuid';
import {
  RoleDef,
  ScriptPack,
  ValidationRule,
  ValidationIssue,
  Game,
} from '../types';

// ============ Townsfolk (13) ============

const clockmaker: RoleDef = {
  id: 'clockmaker',
  name: 'clockmaker',
  zhName: '钟表匠',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个夜晚，你会得知恶魔与爪牙之间最近的距离。（邻座的玩家距离为1）',
  nightOrder: 1,
  firstNight: true,
  otherNights: false,
};

const dreamer: RoleDef = {
  id: 'dreamer',
  name: 'dreamer',
  zhName: '筑梦师',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚，你要选择（除你及旅行者以外的）一名玩家：你会得到一个善良角色和一个邪恶角色，该玩家是其中一个角色',
  nightOrder: 2,
  firstNight: true,
  otherNights: true,
};

const snakeCharmer: RoleDef = {
  id: 'snake_charmer',
  name: 'snake_charmer',
  zhName: '舞蛇人',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚，你要选择一名存活的玩家：如果你选中了恶魔，你和他交换角色和阵营，然后他中毒',
  nightOrder: 3,
  firstNight: true,
  otherNights: true,
};

const mathematician: RoleDef = {
  id: 'mathematician',
  name: 'mathematician',
  zhName: '数学家',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚，你会得知有多少名玩家的能力因为其他角色的能力而未正常生效（从上个黎明到你被唤醒时）',
  nightOrder: 4,
  firstNight: true,
  otherNights: true,
};

const flowergirl: RoleDef = {
  id: 'flowergirl',
  name: 'flowergirl',
  zhName: '卖花女孩',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚*，你会得知在今天白天时是否有恶魔投票',
  nightOrder: 5,
  firstNight: false,
  otherNights: true,
};

const townCrier: RoleDef = {
  id: 'town_crier',
  name: 'town_crier',
  zhName: '城镇公告员',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚*，你会得知在今天白天时是否有爪牙发起过提名',
  nightOrder: 6,
  firstNight: false,
  otherNights: true,
};

const oracle: RoleDef = {
  id: 'oracle',
  name: 'oracle',
  zhName: '神谕者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个夜晚*，你会得知有多少名死亡的玩家是邪恶的',
  nightOrder: 7,
  firstNight: false,
  otherNights: true,
};

const juggler: RoleDef = {
  id: 'juggler',
  name: 'juggler',
  zhName: '杂耍艺人',
  type: 'townsfolk',
  alignment: 'good',
  ability: '在你的首个白天，你可以公开猜测任意玩家的角色最多五次。在当晚，你会得知猜测正确的角色数量',
  nightOrder: 8,
  firstNight: false,
  otherNights: true,
};

const sage: RoleDef = {
  id: 'sage',
  name: 'sage',
  zhName: '贤者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '如果恶魔杀死了你，在当晚你会被唤醒并得知两名玩家，其中一名是杀死你的那个恶魔',
  nightOrder: 9,
  firstNight: false,
  otherNights: true,
};

const savant: RoleDef = {
  id: 'savant',
  name: 'savant',
  zhName: '博学者',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每个白天，你可以下拜访说书人。说书人会告诉你两条信息，一个是正确的，一个是错误的',
};

const seamstress: RoleDef = {
  id: 'seamstress',
  name: 'seamstress',
  zhName: '女裁缝',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每局游戏限一次，在夜晚时，你可以选择（除你以外的）两名玩家：你会得知他们是否为同一阵营',
  nightOrder: 10,
  firstNight: true,
  otherNights: true,
};

const philosopher: RoleDef = {
  id: 'philosopher',
  name: 'philosopher',
  zhName: '哲学家',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每局游戏限一次，在夜晚时，你可以选择一个善良角色：你获得该角色的能力。如果这个角色在场，他醉酒',
  nightOrder: 11,
  firstNight: true,
  otherNights: true,
};

const artist: RoleDef = {
  id: 'artist',
  name: 'artist',
  zhName: '艺术家',
  type: 'townsfolk',
  alignment: 'good',
  ability: '每局游戏限一次，在白天时，你可以私下拜访说书人提问一个是非题，你会得知该问题的答案（是/不是/我不知道）',
};

// ============ Outsiders (4) ============

const mutant: RoleDef = {
  id: 'mutant',
  name: 'mutant',
  zhName: '畸形秀演员',
  type: 'outsider',
  alignment: 'good',
  ability: '如果你"疯狂"地证明自己是外来者，你可能被处决',
};

const barber: RoleDef = {
  id: 'barber',
  name: 'barber',
  zhName: '理发师',
  type: 'outsider',
  alignment: 'good',
  ability: '如果你死亡，在当晚恶魔可以选择两名玩家（不能选择其他恶魔）交换角色（今晚理发）',
  nightOrder: 12,
  firstNight: false,
  otherNights: true,
};

const sweetheart: RoleDef = {
  id: 'sweetheart',
  name: 'sweetheart',
  zhName: '心上人',
  type: 'outsider',
  alignment: 'good',
  ability: '当你死亡时，会有一名玩家开始醉酒',
};

const klutz: RoleDef = {
  id: 'klutz',
  name: 'klutz',
  zhName: '呆瓜',
  type: 'outsider',
  alignment: 'good',
  ability: '当你得知你死亡时，你要公开选择一名存活的玩家：如果他是邪恶的，你的阵营落败',
};

// ============ Minions (4) ============

const witch: RoleDef = {
  id: 'witch',
  name: 'witch',
  zhName: '女巫',
  type: 'minion',
  alignment: 'evil',
  ability: '每个夜晚，你要选择一名玩家：如果他明天白天发起提名，他死亡。如果只有三名存活的玩家，你失去此能力',
  nightOrder: 13,
  firstNight: true,
  otherNights: true,
};

const cerenovus: RoleDef = {
  id: 'cerenovus',
  name: 'cerenovus',
  zhName: '洗脑师',
  type: 'minion',
  alignment: 'evil',
  ability: '每个夜晚，你要选择一名玩家和一个善良角色。他明天白天和夜晚需要"疯狂"地证明自己是这个角色，不然他可能被处决',
  nightOrder: 14,
  firstNight: true,
  otherNights: true,
};

const pitHag: RoleDef = {
  id: 'pit_hag',
  name: 'pit_hag',
  zhName: '麻脸巫婆',
  type: 'minion',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家和一个角色，如果该角色不在场，他变成该角色。如果因此创造了一个恶魔，当晚的死亡由说书人决定（生死无常夜）',
  nightOrder: 15,
  firstNight: false,
  otherNights: true,
};

const evilTwin: RoleDef = {
  id: 'evil_twin',
  name: 'evil_twin',
  zhName: '镜像双子',
  type: 'minion',
  alignment: 'evil',
  ability: '你与一名对立阵营的玩家互相知道对方是什么角色。如果其中善良玩家被处决，邪恶阵营获胜。如果你们都存活，善良阵营无法获胜',
};

// ============ Demons (4) ============

const fangGu: RoleDef = {
  id: 'fang_gu',
  name: 'fang_gu',
  zhName: '方古',
  type: 'demon',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家：他死亡。被该能力杀死的外来者改为变成邪恶的方古且代替他死亡，但每局游戏仅能成功转化一次。[+1外来者]',
  nightOrder: 16,
  firstNight: false,
  otherNights: true,
  setup: true,
};

const noDashii: RoleDef = {
  id: 'no_dashii',
  name: 'no_dashii',
  zhName: '诺·达鳗',
  type: 'demon',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家：他死亡。与你邻近的两名镇民中毒',
  nightOrder: 17,
  firstNight: false,
  otherNights: true,
};

const vigormortis: RoleDef = {
  id: 'vigormortis',
  name: 'vigormortis',
  zhName: '亡骨魔',
  type: 'demon',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家：他死亡。被你杀死的爪牙保留他的能力，且与他邻近的两名镇民之一中毒。[-1外来者]',
  nightOrder: 18,
  firstNight: false,
  otherNights: true,
  setup: true,
};

const vortox: RoleDef = {
  id: 'vortox',
  name: 'vortox',
  zhName: '涡流',
  type: 'demon',
  alignment: 'evil',
  ability: '每个夜晚*，你要选择一名玩家：他死亡。镇民玩家的能力都会产生错误信息。如果白天没人被处决，邪恶阵营获胜',
  nightOrder: 19,
  firstNight: false,
  otherNights: true,
};

// ============ All Roles ============

const allRoles: RoleDef[] = [
  // Townsfolk
  clockmaker,
  dreamer,
  snakeCharmer,
  mathematician,
  flowergirl,
  townCrier,
  oracle,
  juggler,
  sage,
  savant,
  seamstress,
  philosopher,
  artist,
  // Outsiders
  mutant,
  barber,
  sweetheart,
  klutz,
  // Minions
  witch,
  cerenovus,
  pitHag,
  evilTwin,
  // Demons
  fangGu,
  noDashii,
  vigormortis,
  vortox,
];

const savTravelerRoles: RoleDef[] = [];

// ============ Player Count Distribution ============

/**
 * Sects and Violets player count distribution:
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
  const clamped = Math.max(7, Math.min(15, playerCount));
  return distributionTable[clamped] ?? distributionTable[7];
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
  id: 'sav_no_duplicate_claims',
  description: '不允许重复声称同一角色',
  validate: (game: Game, _scriptPack: ScriptPack): ValidationIssue[] => {
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
          ruleId: 'sav_no_duplicate_claims',
        });
      }
    }

    return issues;
  },
};

const roleClaimCountCheck: ValidationRule = {
  id: 'sav_role_claim_count',
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
        ruleId: 'sav_role_claim_count',
      });
    }

    if (claimedByType.outsider > expectedOutsiders) {
      issues.push({
        id: uuidv4(),
        severity: 'warning',
        title: '外来者声称异常',
        message: `声称外来者角色的玩家数(${claimedByType.outsider})超过预期数量(${expectedOutsiders})`,
        impact: '可能有人冒充外来者',
        involvedPlayerIds: [],
        involvedEventIds: [],
        ruleId: 'sav_role_claim_count',
      });
    }

    return issues;
  },
};

// ============ Export Script Pack ============

export { savTravelerRoles };

export const sectsAndVioletsPack: ScriptPack = {
  id: 'sects_and_violets',
  name: 'Sects and Violets',
  zhName: '梦殒春宵',
  edition: 'base-3',
  summary: '角色身份可互换、信息真假难辨的高级脚本，考验深度推理能力。',
  supportedPlayerCounts: [7, 8, 9, 10, 11, 12, 13, 14, 15],
  status: 'stable',
  roles: allRoles,
  townsfolkCount,
  outsiderCount,
  minionCount,
  demonCount,
  validationRules: [
    noDuplicateRoleClaims,
    roleClaimCountCheck,
  ],
};
