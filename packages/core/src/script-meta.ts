import type {
  MechanismTag,
  PlayStyle,
  ScriptPack,
  StatusTag,
  StorytellerControlLevers,
} from './types';

interface ScriptStrategyMeta {
  displayName: string;
  playerCountRange: [number, number];
  statusTags: StatusTag[];
  mechanismTags: MechanismTag[];
  storytellerControlLevers: StorytellerControlLevers;
  supportedPlayStyles: PlayStyle[];
  riskWarnings: string[];
  commonConflictTypes: string[];
  storytellerGuidance: string[];
}

const scriptMetaRegistry: Record<string, ScriptStrategyMeta> = {
  trouble_brewing: {
    displayName: '暗流涌动',
    playerCountRange: [5, 15],
    statusTags: ['poison', 'drunk', 'night_death'],
    mechanismTags: ['distance_logic', 'false_info', 'outsider_count_shift', 'night_order'],
    storytellerControlLevers: {
      infoDistortion: 2,
      stateDisruption: 2,
      resurrectionSwing: 0,
      bluffPressure: 3,
      publicConflict: 3,
    },
    supportedPlayStyles: ['teaching', 'balanced', 'high_pressure'],
    riskWarnings: ['信息位较直，若首夜信息过准容易让好人锁盘', '5-7 人局里过快减员会压缩双方决策空间'],
    commonConflictTypes: ['重复对跳唯一信息位', '外来者数量异常', '共情/厨师/占卜信息链互相打架'],
    storytellerGuidance: ['优先做清晰但可争辩的信息局', '压强可以来自投票与处决，而不是连夜暴毙'],
  },
  bad_moon_rising: {
    displayName: '暗月初升',
    playerCountRange: [7, 15],
    statusTags: ['drunk', 'protection', 'resurrection', 'night_death'],
    mechanismTags: ['night_order', 'death_pressure', 'false_info', 'public_claim_trigger'],
    storytellerControlLevers: {
      infoDistortion: 2,
      stateDisruption: 3,
      resurrectionSwing: 5,
      bluffPressure: 3,
      publicConflict: 4,
    },
    supportedPlayStyles: ['balanced', 'high_pressure', 'theatrical'],
    riskWarnings: ['死亡和复活摆幅大，容易让新手失去节奏感', '若连续两夜多人死亡，容易提前结束推理空间'],
    commonConflictTypes: ['死亡数量异常', '保护链与击杀结果对不上', '复活触发后信息链断裂'],
    storytellerGuidance: ['让死亡节奏有波峰但不要连续失控', '复活类效果要服务戏剧性，也要给白天留下讨论抓手'],
  },
  sects_and_violets: {
    displayName: '梦殒春宵',
    playerCountRange: [7, 15],
    statusTags: ['poison', 'drunk', 'madness', 'role_swap', 'alignment_change'],
    mechanismTags: ['madness', 'role_change', 'alignment_shift', 'false_info', 'bluff_pressure'],
    storytellerControlLevers: {
      infoDistortion: 5,
      stateDisruption: 5,
      resurrectionSwing: 1,
      bluffPressure: 5,
      publicConflict: 5,
    },
    supportedPlayStyles: ['balanced', 'high_confusion', 'high_reversal', 'theatrical'],
    riskWarnings: ['疯狂与换角同时出现时，极易让公开信息爆炸', '若连续制造身份反转，容易让好人失去稳定决策点'],
    commonConflictTypes: ['疯狂裁定争议', '换角后公开信息失真', '阵营变化导致旧世界线整体失效'],
    storytellerGuidance: ['优先保证裁定一致性', '高反转要和公平性检查绑定，不能连续两晚都硬掀桌'],
  },
  dreams_vanishing: {
    displayName: '梦殒春宵',
    playerCountRange: [5, 15],
    statusTags: ['poison', 'drunk', 'madness', 'role_swap', 'alignment_change'],
    mechanismTags: ['madness', 'role_change', 'alignment_shift', 'false_info', 'bluff_pressure'],
    storytellerControlLevers: {
      infoDistortion: 5,
      stateDisruption: 5,
      resurrectionSwing: 1,
      bluffPressure: 5,
      publicConflict: 5,
    },
    supportedPlayStyles: ['balanced', 'high_confusion', 'high_reversal', 'theatrical'],
    riskWarnings: ['当前仍是预览脚本，精确名册和夜序还需继续校对', '适合高混乱局，但不适合一上来就极限信息污染'],
    commonConflictTypes: ['疯狂裁定争议', '换角与中毒叠加后记录错位', '公开信息与真实阵营快速脱钩'],
    storytellerGuidance: ['把疯狂提醒和状态记录绑在一起', '反转要让玩家能回头理解，而不是完全失控'],
  },
  clashing_thunder: {
    displayName: '瓦釜雷鸣',
    playerCountRange: [7, 15],
    statusTags: ['poison', 'drunk', 'night_death'],
    mechanismTags: ['night_order', 'false_info', 'public_claim_trigger'],
    storytellerControlLevers: {
      infoDistortion: 3,
      stateDisruption: 3,
      resurrectionSwing: 1,
      bluffPressure: 4,
      publicConflict: 4,
    },
    supportedPlayStyles: ['balanced', 'high_pressure', 'theatrical'],
    riskWarnings: ['当前为社区预览接入，精确角色表待继续校对', '若直接按高压风格开，会让公开对跳过快失控'],
    commonConflictTypes: ['信息位对跳过密', '节奏偏快导致白天讨论不足'],
    storytellerGuidance: ['适合做强对跳和强表态压力', '白天至少给一轮完整讨论，再考虑补夜间压强'],
  },
  i_am_modavious: {
    displayName: '幻术宗师',
    playerCountRange: [7, 15],
    statusTags: ['poison', 'drunk', 'madness', 'role_swap'],
    mechanismTags: ['false_info', 'role_change', 'bluff_pressure', 'state_tracking'],
    storytellerControlLevers: {
      infoDistortion: 4,
      stateDisruption: 4,
      resurrectionSwing: 1,
      bluffPressure: 5,
      publicConflict: 4,
    },
    supportedPlayStyles: ['high_confusion', 'high_reversal', 'theatrical'],
    riskWarnings: ['高混乱脚本若不给抓手，会让玩家感觉全靠命', '需要明确区分可解释的误导与纯随机混乱'],
    commonConflictTypes: ['信息位失真过多', '伪装路线过度拥挤', '状态追踪被忽视'],
    storytellerGuidance: ['更适合戏剧化与反转式控局', '每晚最好只强化一类混乱，不要所有杠杆一起拉满'],
  },
  outed_evil: {
    displayName: '幽谬道',
    playerCountRange: [7, 15],
    statusTags: ['poison', 'drunk', 'night_death'],
    mechanismTags: ['public_claim_trigger', 'false_info', 'bluff_pressure'],
    storytellerControlLevers: {
      infoDistortion: 3,
      stateDisruption: 2,
      resurrectionSwing: 1,
      bluffPressure: 5,
      publicConflict: 5,
    },
    supportedPlayStyles: ['high_pressure', 'high_confusion', 'theatrical'],
    riskWarnings: ['公开冲突压力大，容易让邪恶被迫过早暴露', '若不给好人留验证点，容易沦为纯嘴炮局'],
    commonConflictTypes: ['高密度对跳', '公开立场和投票结果互相撕裂'],
    storytellerGuidance: ['适合做公开施压和话术博弈', '要给双方都留下可追问的锚点'],
  },
  midnight_carnival: {
    displayName: '夜半狂欢',
    playerCountRange: [7, 15],
    statusTags: ['poison', 'drunk', 'madness', 'night_death'],
    mechanismTags: ['false_info', 'state_tracking', 'public_claim_trigger', 'bluff_pressure'],
    storytellerControlLevers: {
      infoDistortion: 4,
      stateDisruption: 4,
      resurrectionSwing: 1,
      bluffPressure: 4,
      publicConflict: 4,
    },
    supportedPlayStyles: ['balanced', 'high_confusion', 'theatrical'],
    riskWarnings: ['若前两天过乱，后续很难收束到可推理状态', '当前仍是预览接入，建议先走平衡或戏剧化模板'],
    commonConflictTypes: ['状态记录遗漏', '公开信息和夜间结果断链'],
    storytellerGuidance: ['适合做逐步升温而不是开局拉满', '先给玩家建立一条可读信息链，再做反转'],
  },
};

export function applyScriptMeta(scriptPack: ScriptPack): ScriptPack {
  const meta = scriptMetaRegistry[scriptPack.id];
  if (!meta) {
    const counts = [...scriptPack.supportedPlayerCounts].sort((a, b) => a - b);
    return {
      ...scriptPack,
      displayName: scriptPack.zhName,
      playerCountRange: [counts[0], counts[counts.length - 1]],
      nightOrder: scriptPack.roles
        .filter((role) => role.firstNight || role.otherNights)
        .sort((a, b) => (a.nightOrder ?? 999) - (b.nightOrder ?? 999))
        .map((role) => role.id),
    };
  }

  return {
    ...scriptPack,
    displayName: meta.displayName,
    playerCountRange: meta.playerCountRange,
    nightOrder: scriptPack.roles
      .filter((role) => role.firstNight || role.otherNights)
      .sort((a, b) => (a.nightOrder ?? 999) - (b.nightOrder ?? 999))
      .map((role) => role.id),
    statusTags: meta.statusTags,
    mechanismTags: meta.mechanismTags,
    storytellerControlLevers: meta.storytellerControlLevers,
    supportedPlayStyles: meta.supportedPlayStyles,
    riskWarnings: meta.riskWarnings,
    commonConflictTypes: meta.commonConflictTypes,
    storytellerGuidance: meta.storytellerGuidance,
  };
}

export function getScriptMeta(scriptId: string): ScriptStrategyMeta | undefined {
  return scriptMetaRegistry[scriptId];
}
