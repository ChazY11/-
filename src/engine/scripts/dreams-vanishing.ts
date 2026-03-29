import type { RoleDef, ScriptPack } from '../types';
import {
  standardDemonCount,
  standardMinionCount,
  standardOutsiderCount,
  standardTownsfolkCount,
} from './standard-player-counts';

const roles: RoleDef[] = [
  { id: 'clockmaker', name: 'clockmaker', zhName: '钟表匠', type: 'townsfolk', alignment: 'good', ability: '首夜得知恶魔与最近爪牙之间相隔几步。', nightOrder: 1, firstNight: true, tags: ['first-night', 'distance-info'] },
  { id: 'dreamer', name: 'dreamer', zhName: '梦语者', type: 'townsfolk', alignment: 'good', ability: '每晚选择一名玩家，得知一个善良角色与一个邪恶角色，其中一个是其真实角色。', nightOrder: 2, firstNight: true, otherNights: true, tags: ['night-info'] },
  { id: 'snake_charmer', name: 'snake_charmer', zhName: '驯蛇人', type: 'townsfolk', alignment: 'good', ability: '每晚选择一名存活玩家；若其是恶魔，你与其交换角色与阵营。', nightOrder: 3, firstNight: true, otherNights: true, tags: ['swap', 'demon-interaction'] },
  { id: 'mathematician', name: 'mathematician', zhName: '数学家', type: 'townsfolk', alignment: 'good', ability: '每晚得知当晚有多少角色能力因醉酒、中毒或错误注册而异常结算。', nightOrder: 4, firstNight: true, otherNights: true, tags: ['night-info'] },
  { id: 'flowergirl', name: 'flowergirl', zhName: '卖花女孩', type: 'townsfolk', alignment: 'good', ability: '每晚得知今天白天恶魔是否投过票。', nightOrder: 5, firstNight: false, otherNights: true, tags: ['vote-info'] },
  { id: 'town_crier', name: 'town_crier', zhName: '传令官', type: 'townsfolk', alignment: 'good', ability: '每晚得知今天是否有爪牙发起过提名。', nightOrder: 6, firstNight: false, otherNights: true, tags: ['nomination-info'] },
  { id: 'oracle', name: 'oracle', zhName: '神谕者', type: 'townsfolk', alignment: 'good', ability: '每晚得知死去的邪恶玩家数量。', nightOrder: 7, firstNight: true, otherNights: true, tags: ['death-info'] },
  { id: 'seamstress', name: 'seamstress', zhName: '女裁缝', type: 'townsfolk', alignment: 'good', ability: '每局一次，夜晚选择两名玩家，得知他们是否同阵营。', nightOrder: 8, firstNight: true, otherNights: true, tags: ['once-per-game', 'alignment-info'] },
  { id: 'philosopher', name: 'philosopher', zhName: '哲学家', type: 'townsfolk', alignment: 'good', ability: '每局一次，夜晚选择一个善良角色并获得其能力；若该角色在场，则其醉酒。', nightOrder: 9, firstNight: true, otherNights: true, tags: ['once-per-game', 'self-modify'] },
  { id: 'artist', name: 'artist', zhName: '艺术家', type: 'townsfolk', alignment: 'good', ability: '每局一次，白天可以向说书人提出一个是/否问题。', tags: ['once-per-game', 'day-ability'] },
  { id: 'juggler', name: 'juggler', zhName: '杂耍演员', type: 'townsfolk', alignment: 'good', ability: '首日公开猜测最多五名玩家的角色；当晚得知其中猜对了几个。', nightOrder: 10, firstNight: false, otherNights: true, tags: ['public-claim', 'count-info'] },
  { id: 'sage', name: 'sage', zhName: '智者', type: 'townsfolk', alignment: 'good', ability: '若你夜晚被恶魔杀死，得知一名邪恶玩家。', tags: ['death-trigger'] },
  { id: 'savant', name: 'savant', zhName: '博学者', type: 'townsfolk', alignment: 'good', ability: '每天从说书人处得到两条陈述，其中一真一假。', tags: ['day-info'] },

  { id: 'mutant', name: 'mutant', zhName: '突变者', type: 'outsider', alignment: 'good', ability: '若你表现得像自己是外来者，可能会被立刻处决。', tags: ['madness'] },
  { id: 'sweetheart', name: 'sweetheart', zhName: '心上人', type: 'outsider', alignment: 'good', ability: '当你死亡时，一名玩家会醉酒。', tags: ['death-trigger', 'drunk'] },
  { id: 'barber', name: 'barber', zhName: '理发师', type: 'outsider', alignment: 'good', ability: '若你被恶魔杀死，说书人可以交换两名玩家的真实角色。', tags: ['death-trigger', 'swap'] },
  { id: 'klutz', name: 'klutz', zhName: '呆瓜', type: 'outsider', alignment: 'good', ability: '若你被处决，需公开选择一名玩家；若其是邪恶，你的阵营失败。', tags: ['execution-trigger'] },

  { id: 'evil_twin', name: 'evil_twin', zhName: '邪恶双子', type: 'minion', alignment: 'evil', ability: '场上有一名善良双子。双方都活着时好人无法获胜；若善良双子被处决则邪恶获胜。', tags: ['pairing'] },
  { id: 'witch', name: 'witch', zhName: '女巫', type: 'minion', alignment: 'evil', ability: '每晚选择一名玩家；若其明天提名，则其死亡。', nightOrder: 11, firstNight: true, otherNights: true, tags: ['night-kill-trigger'] },
  { id: 'cerenovus', name: 'cerenovus', zhName: '塞雷诺维斯', type: 'minion', alignment: 'evil', ability: '每晚选择一名玩家与一个善良角色；该玩家会被疯狂要求声称自己是那个角色，否则可能被处决。', nightOrder: 12, firstNight: true, otherNights: true, tags: ['madness'] },
  { id: 'pit_hag', name: 'pit_hag', zhName: '坑魔', type: 'minion', alignment: 'evil', ability: '每晚选择一名玩家与一个不在场角色；该玩家变成该角色。若制造了恶魔，可能立即导致额外死亡。', nightOrder: 13, firstNight: true, otherNights: true, tags: ['role-change'] },

  { id: 'fang_gu', name: 'fang_gu', zhName: '方古', type: 'demon', alignment: 'evil', ability: '每晚选择一名玩家，其死亡。第一次杀死外来者时，该玩家会变成邪恶的方古。', nightOrder: 14, firstNight: false, otherNights: true, tags: ['outsider-convert'] },
  { id: 'vigormortis', name: 'vigormortis', zhName: '活腐尸', type: 'demon', alignment: 'evil', ability: '每晚选择一名玩家，其死亡。被你杀死的爪牙仍保留能力，并使一名相邻存活玩家中毒。', nightOrder: 15, firstNight: false, otherNights: true, tags: ['poison', 'dead-minion'] },
  { id: 'no_dashii', name: 'no_dashii', zhName: '诺达希', type: 'demon', alignment: 'evil', ability: '每晚选择一名玩家，其死亡。你的两侧相邻存活玩家会中毒。', nightOrder: 16, firstNight: false, otherNights: true, tags: ['poison', 'neighbor'] },
  { id: 'vortox', name: 'vortox', zhName: '漩涡', type: 'demon', alignment: 'evil', ability: '每晚选择一名玩家，其死亡。镇民获得的讯息全部为假；若白天无人被处决，邪恶立即获胜。', nightOrder: 17, firstNight: false, otherNights: true, tags: ['false-info', 'execution-pressure'] },
];

export const dreamsVanishingPack: ScriptPack = {
  id: 'sects_and_violets',
  name: 'Sects & Violets',
  zhName: '梦殒春宵',
  edition: 'preview-1',
  summary: '更强调变形、疯狂与假信息的进阶脚本，适合在说书人模式下做开局配置。',
  supportedPlayerCounts: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  status: 'preview',
  roles,
  townsfolkCount: standardTownsfolkCount,
  outsiderCount: standardOutsiderCount,
  minionCount: standardMinionCount,
  demonCount: standardDemonCount,
  validationRules: [],
};
