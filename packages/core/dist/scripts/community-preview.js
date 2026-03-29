import { standardDemonCount, standardMinionCount, standardOutsiderCount, standardTownsfolkCount, } from './standard-player-counts';
import { troubleBrewingPack } from './trouble-brewing';
import { badMoonRisingPack } from './bad-moon-rising';
import { sectsAndVioletsPack } from './sects-and-violets';
import { dreamsVanishingPack } from './dreams-vanishing';
const previewRolePool = [
    ...troubleBrewingPack.roles,
    ...badMoonRisingPack.roles,
    ...sectsAndVioletsPack.roles,
    ...dreamsVanishingPack.roles,
].reduce((acc, role) => {
    var _a;
    if (acc.some((entry) => entry.id === role.id)) {
        return acc;
    }
    acc.push(Object.assign(Object.assign({}, role), { tags: [...new Set([...((_a = role.tags) !== null && _a !== void 0 ? _a : []), 'community-preview'])] }));
    return acc;
}, []);
function createCommunityPreviewPack(id, name, zhName, summary) {
    return {
        id,
        name,
        zhName,
        edition: 'community-preview-1',
        summary,
        supportedPlayerCounts: [7, 8, 9, 10, 11, 12, 13, 14, 15],
        status: 'preview',
        roles: previewRolePool,
        townsfolkCount: standardTownsfolkCount,
        outsiderCount: standardOutsiderCount,
        minionCount: standardMinionCount,
        demonCount: standardDemonCount,
        validationRules: [],
    };
}
export const clashingThunderPack = createCommunityPreviewPack('clashing_thunder', 'Clashing Thunder', '瓦釜雷鸣', '社区剧本预览接入：已提供脚本入口与混合角色库，后续再按海报逐项校对专属角色名单与夜间顺序。');
export const iAmModaviousPack = createCommunityPreviewPack('i_am_modavious', 'I Am Modavious', '幻术宗师', '社区剧本预览接入：先支持建局、模式切换与角色记录，后续继续补齐该板子的精确名册与特殊规则。');
export const outedEvilPack = createCommunityPreviewPack('outed_evil', 'Outed Evil', '幽谬道', '社区剧本预览接入：当前复用现有角色库以保证小程序可用，后续再补这套板子的定制角色与逻辑。');
export const midnightCarnivalPack = createCommunityPreviewPack('midnight_carnival', 'Midnight Carnival', '夜半狂欢', '社区剧本预览接入：已纳入脚本选择列表，可直接创建对局；后续将继续收敛为夜半狂欢的精确角色组合。');
//# sourceMappingURL=community-preview.js.map