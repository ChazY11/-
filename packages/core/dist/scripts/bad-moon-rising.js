import { createId } from '../id';
// ============ Townsfolk (13) ============
const grandmother = {
    id: 'grandmother',
    name: 'grandmother',
    zhName: '祖母',
    type: 'townsfolk',
    alignment: 'good',
    ability: '在你的首个夜晚，你会得知一名善良玩家和他的角色。如果恶魔杀死了他，你也会死亡',
    nightOrder: 1,
    firstNight: true,
    otherNights: false,
};
const sailor = {
    id: 'sailor',
    name: 'sailor',
    zhName: '水手',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个夜晚，你要选择一名存活的玩家：你或他之一会醉酒直到下个黄昏。你不会死亡',
    nightOrder: 2,
    firstNight: true,
    otherNights: true,
};
const chambermaid = {
    id: 'chambermaid',
    name: 'chambermaid',
    zhName: '侍女',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个夜晚，你要选择除你以外的两名存活的玩家：你会得知他们中有几人在当晚因其自身能力而被唤醒',
    nightOrder: 3,
    firstNight: true,
    otherNights: true,
};
const exorcist = {
    id: 'exorcist',
    name: 'exorcist',
    zhName: '驱魔人',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个夜晚*，你要选择一名玩家（与上个夜晚不同）：如果你选中了恶魔，他会得知你是驱魔人，但他当晚不会因其自身能力而被唤醒',
    nightOrder: 4,
    firstNight: false,
    otherNights: true,
};
const innkeeper = {
    id: 'innkeeper',
    name: 'innkeeper',
    zhName: '旅店老板',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个夜晚*，你要选择两名玩家：他们当晚不会死亡，但其中一人会醉酒到下个黄昏',
    nightOrder: 5,
    firstNight: false,
    otherNights: true,
};
const gambler = {
    id: 'gambler',
    name: 'gambler',
    zhName: '赌徒',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个夜晚*，你要选择一名玩家并猜测他的角色：如果你猜错了，你会死亡',
    nightOrder: 6,
    firstNight: false,
    otherNights: true,
};
const gossip = {
    id: 'gossip',
    name: 'gossip',
    zhName: '造谣者',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每个白天，你可以公开发表一个声明。如果该声明正确，在当晚会有一名玩家死亡',
    nightOrder: 7,
    firstNight: false,
    otherNights: true,
};
const courtier = {
    id: 'courtier',
    name: 'courtier',
    zhName: '侍臣',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每局游戏限一次，在夜晚时，你可以选择一个角色：如果该角色在场，该角色的玩家会连续三天三夜醉酒',
    nightOrder: 8,
    firstNight: true,
    otherNights: true,
};
const professor = {
    id: 'professor',
    name: 'professor',
    zhName: '教授',
    type: 'townsfolk',
    alignment: 'good',
    ability: '每局游戏限一次，在夜晚时，你可以选择一名死亡的玩家：如果他是镇民，你会将他起死回生（复活）',
    nightOrder: 9,
    firstNight: false,
    otherNights: true,
};
const minstrel = {
    id: 'minstrel',
    name: 'minstrel',
    zhName: '吟游诗人',
    type: 'townsfolk',
    alignment: 'good',
    ability: '当一名爪牙死于处决时，（你除了和旅行者以外的）所有其他玩家醉酒直到明天黄昏',
};
const teaLady = {
    id: 'tea_lady',
    name: 'tea_lady',
    zhName: '茶艺师',
    type: 'townsfolk',
    alignment: 'good',
    ability: '如果与你邻近的两名存活的玩家是善良的，他们不会死亡',
};
const pacifist = {
    id: 'pacifist',
    name: 'pacifist',
    zhName: '和平主义者',
    type: 'townsfolk',
    alignment: 'good',
    ability: '被处决的善良玩家可能不会死亡',
};
const fool = {
    id: 'fool',
    name: 'fool',
    zhName: '弄臣',
    type: 'townsfolk',
    alignment: 'good',
    ability: '当你首次将要死亡时，你不会死亡',
};
// ============ Outsiders (4) ============
const tinker = {
    id: 'tinker',
    name: 'tinker',
    zhName: '修补匠',
    type: 'outsider',
    alignment: 'good',
    ability: '你随时可能死亡',
};
const moonchild = {
    id: 'moonchild',
    name: 'moonchild',
    zhName: '月之子',
    type: 'outsider',
    alignment: 'good',
    ability: '当你得知你死亡时，你要公开选择一名存活的玩家：如果他是善良的，在当晚他会死亡',
};
const goon = {
    id: 'goon',
    name: 'goon',
    zhName: '莽夫',
    type: 'outsider',
    alignment: 'good',
    ability: '每个夜晚，首个使用其自身能力选择了你的玩家会醉酒直到下个黄昏。你会转变为他的阵营',
    nightOrder: 10,
    firstNight: true,
    otherNights: true,
};
const lunatic = {
    id: 'lunatic',
    name: 'lunatic',
    zhName: '疯子',
    type: 'outsider',
    alignment: 'good',
    ability: '你以为你是一个恶魔，但其实你不是。恶魔知道你是疯子以及你在每个夜晚选择了哪些玩家',
    setup: true,
};
// ============ Minions (4) ============
const godfather = {
    id: 'godfather',
    name: 'godfather',
    zhName: '教父',
    type: 'minion',
    alignment: 'evil',
    ability: '在你的首个夜晚，你会得知有哪些外来者角色在场。如果有外来者在白天死亡，你会在当晚被唤醒并且让你要选择一名玩家：他死亡。[-1或+1外来者]',
    nightOrder: 11,
    firstNight: true,
    otherNights: true,
    setup: true,
};
const devilAdvocate = {
    id: 'devil_advocate',
    name: 'devil_advocate',
    zhName: '魔鬼代言人',
    type: 'minion',
    alignment: 'evil',
    ability: '每个夜晚，你要选择一名存活的玩家（与上个夜晚不同）：如果明天白天他被处决，他不会死亡',
    nightOrder: 12,
    firstNight: true,
    otherNights: true,
};
const assassin = {
    id: 'assassin',
    name: 'assassin',
    zhName: '刺客',
    type: 'minion',
    alignment: 'evil',
    ability: '每局游戏限一次，在夜晚时*，你可以选择一名玩家：他死亡，即使因为任何原因他本不会死亡（无视防御）',
    nightOrder: 13,
    firstNight: false,
    otherNights: true,
};
const mastermind = {
    id: 'mastermind',
    name: 'mastermind',
    zhName: '主谋',
    type: 'minion',
    alignment: 'evil',
    ability: '如果恶魔因为死于处决而因此导致游戏结束时，再额外进行一个夜晚和一个白天（主谋日）。在那个白天如果有玩家被处决，他的阵营落败',
};
// ============ Demons (4) ============
const zombuul = {
    id: 'zombuul',
    name: 'zombuul',
    zhName: '僵怖',
    type: 'demon',
    alignment: 'evil',
    ability: '每个夜晚*，如果今天白天没有人死亡，你会被唤醒并要选择一名玩家：他死亡。当你首次死亡后，你仍存活，但是（在其他玩家视野里）会被当作死亡',
    nightOrder: 14,
    firstNight: false,
    otherNights: true,
};
const pukka = {
    id: 'pukka',
    name: 'pukka',
    zhName: '普卡',
    type: 'demon',
    alignment: 'evil',
    ability: '每个夜晚，你要选择一名玩家：他中毒。上个夜晚因你的能力中毒的玩家会死亡然后恢复健康',
    nightOrder: 15,
    firstNight: true,
    otherNights: true,
};
const shabaloth = {
    id: 'shabaloth',
    name: 'shabaloth',
    zhName: '沙巴洛斯',
    type: 'demon',
    alignment: 'evil',
    ability: '每个夜晚*，你要选择两名玩家：他们死亡。你上个夜晚选择过且当前死亡的玩家之一可能会被你反勾（复活）',
    nightOrder: 16,
    firstNight: false,
    otherNights: true,
};
const po = {
    id: 'po',
    name: 'po',
    zhName: '珀',
    type: 'demon',
    alignment: 'evil',
    ability: '每个夜晚*，你可以选择一名玩家：他死亡。如果你上次选择时没有选择任何玩家，当晚你要选择三名玩家：他们死亡',
    nightOrder: 17,
    firstNight: false,
    otherNights: true,
};
// ============ All Roles ============
const allRoles = [
    // Townsfolk
    grandmother,
    sailor,
    chambermaid,
    exorcist,
    innkeeper,
    gambler,
    gossip,
    courtier,
    professor,
    minstrel,
    teaLady,
    pacifist,
    fool,
    // Outsiders
    tinker,
    moonchild,
    goon,
    lunatic,
    // Minions
    godfather,
    devilAdvocate,
    assassin,
    mastermind,
    // Demons
    zombuul,
    pukka,
    shabaloth,
    po,
];
const bmrTravelerRoles = [];
// ============ Player Count Distribution ============
/**
 * Bad Moon Rising player count distribution:
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
const distributionTable = {
    7: [5, 0, 1, 1],
    8: [5, 1, 1, 1],
    9: [5, 2, 1, 1],
    10: [7, 0, 2, 1],
    11: [7, 1, 2, 1],
    12: [7, 2, 2, 1],
    13: [9, 0, 3, 1],
    14: [9, 1, 3, 1],
    15: [9, 2, 3, 1],
};
function getDistribution(playerCount) {
    var _a;
    const clamped = Math.max(7, Math.min(15, playerCount));
    return (_a = distributionTable[clamped]) !== null && _a !== void 0 ? _a : distributionTable[7];
}
function townsfolkCount(playerCount) {
    return getDistribution(playerCount)[0];
}
function outsiderCount(playerCount) {
    return getDistribution(playerCount)[1];
}
function minionCount(playerCount) {
    return getDistribution(playerCount)[2];
}
function demonCount(playerCount) {
    return getDistribution(playerCount)[3];
}
// ============ Validation Rules ============
const noDuplicateRoleClaims = {
    id: 'bmr_no_duplicate_claims',
    description: '不允许重复声称同一角色',
    validate: (game, _scriptPack) => {
        var _a;
        const issues = [];
        const claimedRoles = new Map();
        for (const player of game.players) {
            if (player.claimedRole) {
                const existing = (_a = claimedRoles.get(player.claimedRole)) !== null && _a !== void 0 ? _a : [];
                existing.push(player.id);
                claimedRoles.set(player.claimedRole, existing);
            }
        }
        for (const [roleId, playerIds] of claimedRoles.entries()) {
            if (playerIds.length > 1) {
                const role = allRoles.find((r) => r.id === roleId);
                const roleName = role ? role.zhName : roleId;
                issues.push({
                    id: createId('issue'),
                    severity: 'error',
                    title: '唯一身份冲突',
                    message: `多名玩家声称自己是${roleName}`,
                    impact: '当前脚本中该身份只能存在1个，至少一人在说谎',
                    involvedPlayerIds: playerIds,
                    involvedEventIds: [],
                    ruleId: 'bmr_no_duplicate_claims',
                });
            }
        }
        return issues;
    },
};
const roleClaimCountCheck = {
    id: 'bmr_role_claim_count',
    description: '声称角色数量与预期角色分配数量的对比检查',
    validate: (game, scriptPack) => {
        var _a;
        const issues = [];
        const claimedByType = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
        for (const player of game.players) {
            if (player.claimedRole) {
                const role = scriptPack.roles.find((r) => r.id === player.claimedRole);
                if (role) {
                    claimedByType[role.type] = ((_a = claimedByType[role.type]) !== null && _a !== void 0 ? _a : 0) + 1;
                }
            }
        }
        const expectedTownsfolk = scriptPack.townsfolkCount(game.playerCount);
        const expectedOutsiders = scriptPack.outsiderCount(game.playerCount);
        if (claimedByType.townsfolk > expectedTownsfolk) {
            issues.push({
                id: createId('issue'),
                severity: 'warning',
                title: '镇民声称过多',
                message: `声称镇民角色的玩家数(${claimedByType.townsfolk})超过预期数量(${expectedTownsfolk})`,
                impact: '可能存在邪恶玩家冒充镇民',
                involvedPlayerIds: [],
                involvedEventIds: [],
                ruleId: 'bmr_role_claim_count',
            });
        }
        if (claimedByType.outsider > expectedOutsiders) {
            issues.push({
                id: createId('issue'),
                severity: 'warning',
                title: '外来者声称异常',
                message: `声称外来者角色的玩家数(${claimedByType.outsider})超过预期数量(${expectedOutsiders})`,
                impact: '若无教父在场，则可能有人冒充外来者',
                involvedPlayerIds: [],
                involvedEventIds: [],
                ruleId: 'bmr_role_claim_count',
            });
        }
        return issues;
    },
};
// ============ Export Script Pack ============
export { bmrTravelerRoles };
export const badMoonRisingPack = {
    id: 'bad_moon_rising',
    name: 'Bad Moon Rising',
    zhName: '暗月初升',
    edition: 'base-2',
    summary: '死亡频繁、防护与复活交织的中级脚本，适合有经验的玩家。',
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
//# sourceMappingURL=bad-moon-rising.js.map