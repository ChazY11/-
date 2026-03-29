import { calculateSuspicion } from './suspicion';
import { validateGame } from './validator';
function topSuspicious(game, scriptPack) {
    return calculateSuspicion(game, scriptPack)
        .sort((a, b) => b.evilProbability - a.evilProbability)
        .slice(0, 3);
}
function playerName(game, playerId) {
    const player = game.players.find((entry) => entry.id === playerId);
    return player ? `#${player.seatNumber} ${player.name}` : playerId;
}
function alivePlayers(game) {
    return game.players.filter((player) => player.isAlive);
}
function deadPlayers(game) {
    return game.players.filter((player) => !player.isAlive);
}
function claimedPlayers(game) {
    return game.players.filter((player) => player.claimedRole);
}
function unclaimedPlayers(game) {
    return game.players.filter((player) => !player.claimedRole);
}
function statefulPlayers(game) {
    return game.players.filter((player) => (player.state.poisoned ||
        player.state.drunk ||
        player.state.mad ||
        player.state.protected ||
        player.state.roleChanged ||
        player.state.alignmentChanged));
}
function issuesWithoutInfo(game, scriptPack) {
    return validateGame(game, scriptPack).filter((issue) => issue.severity !== 'info');
}
function highestPressureEntry(game, scriptPack) {
    var _a;
    return (_a = topSuspicious(game, scriptPack)[0]) !== null && _a !== void 0 ? _a : null;
}
function highestPressureTarget(game, scriptPack) {
    const target = highestPressureEntry(game, scriptPack);
    return target ? playerName(game, target.playerId) : '暂时没有特别突出的高压目标';
}
function classifyStoryState(game, scriptPack) {
    const issues = validateGame(game, scriptPack);
    const aliveCount = alivePlayers(game).length;
    if (issues.filter((issue) => issue.severity === 'error').length >= 2)
        return '偏乱';
    if (aliveCount <= Math.ceil(game.players.length / 2))
        return '收束中';
    if (game.events.length <= game.players.length)
        return '偏顺';
    return '平衡中';
}
function phaseLabel(game) {
    return game.currentPhase === 'night'
        ? `第 ${Math.max(game.currentNight, 1)} 夜`
        : `第 ${Math.max(game.currentDay, 1)} 天`;
}
function openingPressure(scriptPack) {
    var _a, _b, _c, _d, _e, _f;
    const info = (_b = (_a = scriptPack.storytellerControlLevers) === null || _a === void 0 ? void 0 : _a.infoDistortion) !== null && _b !== void 0 ? _b : 0;
    const state = (_d = (_c = scriptPack.storytellerControlLevers) === null || _c === void 0 ? void 0 : _c.stateDisruption) !== null && _d !== void 0 ? _d : 0;
    const revival = (_f = (_e = scriptPack.storytellerControlLevers) === null || _e === void 0 ? void 0 : _e.resurrectionSwing) !== null && _f !== void 0 ? _f : 0;
    if (revival >= 4 || state >= 5)
        return '高变动开局';
    if (info >= 4)
        return '高污染开局';
    if (info <= 2 && state <= 2)
        return '清晰开局';
    return '平衡开局';
}
function buildGoodHeadlineCards(game, scriptPack) {
    const issues = issuesWithoutInfo(game, scriptPack);
    const action = issues.length > 0 ? '优先追问' : game.currentPhase === 'day' ? '继续保留' : '等白天发力';
    return [
        {
            id: 'good-action',
            title: '今日建议动作',
            value: action,
            detail: issues.length > 0 ? '先压缩公开冲突，再决定是否直接处决。' : '当前更适合保留信息位，继续补完整公开口径。',
            tone: 'good',
        },
        {
            id: 'good-target',
            title: '最值得追问',
            value: highestPressureTarget(game, scriptPack),
            detail: '优先让他给出可验证口径，或者解释昨日矛盾。',
            tone: 'warning',
        },
        {
            id: 'good-public',
            title: '公开局势',
            value: `${claimedPlayers(game).length}/${game.players.length} 已报身份`,
            detail: '这里只根据公开信息给建议，不暴露任何私密或说书人信息。',
            tone: 'neutral',
        },
    ];
}
function buildGoodSections(game, scriptPack) {
    var _a, _b, _c;
    const suspicion = topSuspicious(game, scriptPack);
    const issues = issuesWithoutInfo(game, scriptPack).slice(0, 3);
    const unclaimed = unclaimedPlayers(game).slice(0, 3);
    return [
        {
            id: 'good-public',
            title: '公开信息重点',
            items: [
                `${claimedPlayers(game).length} 人已报身份，${unclaimed.length} 个位置仍适合继续追问。`,
                `${(_a = scriptPack.displayName) !== null && _a !== void 0 ? _a : scriptPack.zhName} 当前最值得从“${(_c = (_b = scriptPack.commonConflictTypes) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : '公开信息冲突'}”开始缩圈。`,
                game.currentPhase === 'day'
                    ? '白天先处理对跳、投票和提名矛盾，再决定是否直接处决。'
                    : '夜晚前先整理公开口径，明天优先压改口和补报。',
            ],
        },
        {
            id: 'good-pressure',
            title: '最值得追问的人',
            items: suspicion.length > 0
                ? suspicion.map((entry) => { var _a; return `${playerName(game, entry.playerId)}：当前公开视角下压力较高，原因是 ${(_a = entry.reasons[0]) !== null && _a !== void 0 ? _a : '口径压力偏大'}。`; })
                : ['当前没有足够的公开矛盾，请继续补事件和报身份。'],
        },
        {
            id: 'good-conflicts',
            title: '关键矛盾点',
            items: issues.length > 0
                ? issues.map((issue) => issue.title ? `${issue.title}：${issue.message}` : issue.message)
                : ['当前没有明显硬冲突，可以把精力放在投票、顺序和站队变化上。'],
        },
    ];
}
function buildEvilHeadlineCards(game, scriptPack) {
    var _a, _b;
    const suspicion = topSuspicious(game, scriptPack);
    const route = suspicion.some((entry) => entry.evilProbability > 0.72) ? '搅乱' : game.currentDay <= 1 ? '低调' : '对跳';
    const dangerLine = issuesWithoutInfo(game, scriptPack)[0];
    return [
        {
            id: 'evil-route',
            title: '当前更适合',
            value: route,
            detail: route === '低调' ? '先维持口径连续，不急着抢最亮的信息位。' : '通过制造第二焦点，分散好人视线。',
            tone: 'evil',
        },
        {
            id: 'evil-danger',
            title: '最危险公开线',
            value: (_a = dangerLine === null || dangerLine === void 0 ? void 0 : dangerLine.title) !== null && _a !== void 0 ? _a : '暂时没有硬冲突',
            detail: (_b = dangerLine === null || dangerLine === void 0 ? void 0 : dangerLine.message) !== null && _b !== void 0 ? _b : '真正危险的是好人开始收束成单一可信世界线。',
            tone: 'warning',
        },
        {
            id: 'evil-target',
            title: '优先处理对象',
            value: highestPressureTarget(game, scriptPack),
            detail: '可以推进、保留或反向误导，但别让他成为唯一焦点。',
            tone: 'neutral',
        },
    ];
}
function buildEvilSections(game, scriptPack) {
    var _a, _b, _c;
    const suspicion = topSuspicious(game, scriptPack);
    const dangerLines = issuesWithoutInfo(game, scriptPack).slice(0, 2);
    const infoRoles = game.players.filter((player) => {
        var _a;
        const role = player.claimedRole ? scriptPack.roles.find((entry) => entry.id === player.claimedRole) : null;
        return (_a = role === null || role === void 0 ? void 0 : role.tags) === null || _a === void 0 ? void 0 : _a.some((tag) => ['first-night', 'distance-info', 'night-info', 'count-info'].includes(tag));
    }).slice(0, 3);
    const evilPosture = game.currentDay <= 1
        ? '低调铺垫'
        : suspicion.some((entry) => entry.evilProbability > 0.72) ? '搅乱转压' : '对跳施压';
    return [
        {
            id: 'evil-posture',
            title: '当前路线建议',
            items: [
                `推荐路线：${evilPosture}。先保证公开口径连贯，再决定是否主动抢信息位。`,
                `${(_a = scriptPack.displayName) !== null && _a !== void 0 ? _a : scriptPack.zhName} 的主要危险点在“${(_c = (_b = scriptPack.commonConflictTypes) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : '信息链冲突'}”，邪恶方最好提前准备口径。`,
                game.currentPhase === 'day'
                    ? '白天优先找一个能带节奏的公开矛盾，不要让好人顺着同一条线盘到底。'
                    : '夜晚阶段优先决定明天谁要被推成危险位，谁要被保留成争议位。',
            ],
        },
        {
            id: 'evil-bluff',
            title: '伪装与误导建议',
            items: [
                infoRoles.length > 0
                    ? `当前公开信息位较亮的是 ${infoRoles.map((player) => playerName(game, player.id)).join('、')}，更适合补一条“可验证但不会立刻穿帮”的伪装。`
                    : '目前场上信息位不密集，邪恶方可以先经营中立位和投票位，不必急着对跳最亮信息位。',
                suspicion.length > 0
                    ? `如果 ${playerName(game, suspicion[0].playerId)} 已被多数人盯上，更适合把节奏转移到第二矛盾点，而不是硬保。`
                    : '当前邪恶位还没被明显锁死，可以继续维持多焦点局面。',
                '优先选择“能解释昨天，也能撑到明天”的身份路线，避免只为一轮发言而硬跳。',
            ],
        },
        {
            id: 'evil-danger',
            title: '当前最危险的公开信息',
            items: dangerLines.length > 0
                ? dangerLines.map((issue) => { var _a; return `${(_a = issue.title) !== null && _a !== void 0 ? _a : '危险公开线'}：${issue.message}`; })
                : ['当前没有显著硬冲突，真正危险的是好人开始收束到单一可信世界线。'],
        },
    ];
}
function buildGuardrailChecks(game, scriptPack) {
    const issues = validateGame(game, scriptPack);
    const aliveCount = alivePlayers(game).length;
    const hardErrors = issues.filter((issue) => issue.severity === 'error').length;
    const pressureTarget = highestPressureEntry(game, scriptPack);
    const stateCount = statefulPlayers(game).length;
    return [
        hardErrors >= 2
            ? '当前已有多条硬冲突，继续加强干扰容易越过公平护栏。'
            : '当前硬冲突数量可控，还能通过轻度控局继续制造张力。',
        aliveCount <= Math.ceil(game.players.length / 2)
            ? '存活人数已经偏少，今晚不适合再做过强减员，否则会压缩双方决策空间。'
            : '生者数量仍允许节奏拉扯，但别用减员替代讨论。',
        pressureTarget && pressureTarget.evilProbability > 0.8
            ? `当前 ${playerName(game, pressureTarget.playerId)} 已承担极高桌面压力，继续单点加码容易显得过度针对。`
            : '当前还没有玩家被桌面一致锁死，仍可用多焦点控局维持讨论。',
        stateCount >= Math.ceil(game.players.length / 3)
            ? '状态扰动位已偏多，今晚更适合回收可读线，而不是继续叠加复杂状态。'
            : '状态扰动仍在可控范围内，可以谨慎追加一层戏剧性。',
    ];
}
function buildStorytellerHeadlineCards(game, scriptPack) {
    var _a, _b;
    const state = classifyStoryState(game, scriptPack);
    const levers = scriptPack.storytellerControlLevers;
    const tonightGoal = state === '偏顺'
        ? '加压'
        : state === '偏乱'
            ? '回收'
            : state === '收束中'
                ? '守平衡'
                : '埋反转';
    return [
        {
            id: 'st-state',
            title: '当前局势',
            value: state,
            detail: '综合公开记录、事件量和冲突密度得出。',
            tone: state === '偏乱' ? 'warning' : 'neutral',
        },
        {
            id: 'st-goal',
            title: '今晚建议目标',
            value: tonightGoal,
            detail: tonightGoal === '加压' ? '让局势更有张力，但不要一晚掀翻全部信息链。' : '优先保留双方决策空间和白天讨论性。',
            tone: 'good',
        },
        {
            id: 'st-lever',
            title: '说书杠杆',
            value: `信息 ${(_a = levers === null || levers === void 0 ? void 0 : levers.infoDistortion) !== null && _a !== void 0 ? _a : 0} / 状态 ${(_b = levers === null || levers === void 0 ? void 0 : levers.stateDisruption) !== null && _b !== void 0 ? _b : 0}`,
            detail: '用于判断这一板更适合做污染、状态、节奏还是反转型控局。',
            tone: 'neutral',
        },
    ];
}
function buildStorytellerOverview(game, scriptPack) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const issues = validateGame(game, scriptPack);
    const aliveCount = alivePlayers(game).length;
    const imbalanceHint = aliveCount <= Math.ceil(game.players.length / 2)
        ? '对局已经进入收束区，今晚建议优先考虑“保持双方仍有决策权”。'
        : issues.filter((issue) => issue.severity === 'error').length > 1
            ? '当前公开局势已经偏乱，今晚更适合做回收，而不是继续加码。'
            : '当前局势仍有空间，可以选择平衡推进、加压推进或埋反转。';
    return {
        id: 'storyteller-overview',
        title: '控局摘要',
        items: [
            `当前脚本：${(_a = scriptPack.displayName) !== null && _a !== void 0 ? _a : scriptPack.zhName}。机制重心是 ${((_b = scriptPack.mechanismTags) !== null && _b !== void 0 ? _b : []).slice(0, 3).join(' / ') || '公开信息对抗'}。`,
            `当前阶段：${phaseLabel(game)}。存活 ${alivePlayers(game).length} 人，死亡 ${deadPlayers(game).length} 人。`,
            imbalanceHint,
            `说书杠杆：信息污染 ${(_d = (_c = scriptPack.storytellerControlLevers) === null || _c === void 0 ? void 0 : _c.infoDistortion) !== null && _d !== void 0 ? _d : 0} / 状态扰动 ${(_f = (_e = scriptPack.storytellerControlLevers) === null || _e === void 0 ? void 0 : _e.stateDisruption) !== null && _f !== void 0 ? _f : 0} / 复活摆幅 ${(_h = (_g = scriptPack.storytellerControlLevers) === null || _g === void 0 ? void 0 : _g.resurrectionSwing) !== null && _h !== void 0 ? _h : 0}。`,
        ],
    };
}
function buildStorytellerSections(game, scriptPack) {
    var _a, _b;
    return [
        buildStorytellerOverview(game, scriptPack),
        {
            id: 'storyteller-guardrails',
            title: '公平性护栏',
            items: [
                ...((_a = scriptPack.riskWarnings) !== null && _a !== void 0 ? _a : []).slice(0, 2),
                ...((_b = scriptPack.storytellerGuidance) !== null && _b !== void 0 ? _b : []).slice(0, 2),
                ...buildGuardrailChecks(game, scriptPack).slice(0, 2),
            ],
        },
    ];
}
function buildStyleTemplate(style, scriptPack, focus, risk, recommendedFor, recommendedPlayers, levers, guardrails) {
    return {
        id: style,
        style,
        title: style === 'balanced'
            ? '平衡案'
            : style === 'high_pressure'
                ? '高压案'
                : style === 'high_confusion'
                    ? '高混乱案'
                    : style === 'high_reversal'
                        ? '反转案'
                        : '戏剧案',
        focus,
        risk,
        recommendedFor,
        recommendedPlayers,
        levers,
        guardrails,
    };
}
function buildStorytellerOptions(scriptPack) {
    var _a;
    const supported = new Set((_a = scriptPack.supportedPlayStyles) !== null && _a !== void 0 ? _a : ['balanced']);
    const options = [];
    options.push(buildStyleTemplate('balanced', scriptPack, '保留至少一条可读信息链，用轻度污染或轻度节奏波动制造讨论张力。', '如果局势已经明显偏顺，平衡推进可能显得不够有戏。', '教学局、混合水平局、需要稳住节奏的长桌。', '适合新手到中阶玩家混桌。', ['轻污染', '轻状态扰动', '可回溯口径'], ['不要同时叠加两种强干扰', '白天必须保留至少一个可追问抓手']));
    if (supported.has('high_pressure')) {
        options.push(buildStyleTemplate('high_pressure', scriptPack, '把压力放在投票、提名、单点死亡或对跳上，逼出更明确的站队。', '若同时削弱太多信息链，容易让某一阵营直接失去决策空间。', '熟人局、能承受更强节奏的中高阶桌。', '更适合中阶以上玩家。', ['投票压力', '提名节奏', '单点强冲突'], ['不要连续两晚高压减员', '不要把同一玩家变成唯一靶点']));
    }
    if (supported.has('high_confusion')) {
        options.push(buildStyleTemplate('high_confusion', scriptPack, '强化状态扰动、错口与多线并存，让玩家必须主动整理信息层次。', '如果没有回收线，会很快从“刺激”变成“纯乱”。', '熟悉脚本机制、愿意接受复杂讨论的桌。', '更适合熟练玩家桌。', ['状态扰动', '信息污染', '多焦点并存'], ['每晚最多强化一种主要混乱源', '第二天必须保留一条可回读主线']));
    }
    if (supported.has('high_reversal')) {
        options.push(buildStyleTemplate('high_reversal', scriptPack, '围绕角色变化、阵营变化或关键误判埋伏笔，让中后段出现结构性翻盘。', '没有伏笔的反转会直接触发公平性争议。', '追求戏剧张力、但能接受前置信息铺垫的熟练局。', '更适合中高阶和熟练玩家。', ['伏笔铺设', '可解释反转', '中后段翻盘点'], ['反转必须能回溯', '不要连续两晚做硬翻盘']));
    }
    if (supported.has('theatrical')) {
        options.push(buildStyleTemplate('theatrical', scriptPack, '强调氛围、角色感和叙事节奏，让每轮讨论都有明确戏剧冲突。', '如果只剩戏剧感没有推理抓手，会让玩家觉得失控。', '熟人娱乐局、偏剧情和表演感的桌。', '适合熟人桌和愿意配合氛围的玩家。', ['叙事感', '公开冲突', '节奏波峰'], ['戏剧效果不能替代合法裁定', '每个高潮后都要留下可讨论信息']));
    }
    return options;
}
function buildStorytellerOpeningSections(game, scriptPack) {
    var _a, _b, _c;
    const playerLevelHint = game.playerCount <= 7 ? '短桌更怕节奏过快崩盘' : '长桌更怕信息层次一次性爆炸';
    return [
        {
            id: 'opening-config',
            title: '开局配置建议',
            items: [
                `推荐开局基调：${openingPressure(scriptPack)}。优先根据 ${(_a = scriptPack.displayName) !== null && _a !== void 0 ? _a : scriptPack.zhName} 的核心机制设置第一天可读的公共话题。`,
                `人数 ${game.playerCount} 人，${playerLevelHint}，开局最好先给玩家一条能在第一天讨论的主线。`,
                (_c = (_b = scriptPack.storytellerGuidance) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : '第一晚的操作要服务于第二天讨论，而不是只服务于夜间戏剧性。',
            ],
        },
        {
            id: 'opening-target',
            title: '今晚前置目标',
            items: [
                classifyStoryState(game, scriptPack) === '偏顺'
                    ? '适合加一点压力或污染，让白天不至于过早收束成唯一世界线。'
                    : classifyStoryState(game, scriptPack) === '偏乱'
                        ? '适合回收可读线，把前面造成的混乱整理成可追问的信息。'
                        : '适合继续维持双方都能决策的平衡局面，不要让任何一方被一夜锁死。',
                '优先选择“明天能被追问”的控局手段，而不是只让今晚看起来很炸。',
            ],
        },
    ];
}
function buildGenericAdvice(game, scriptPack, perspective) {
    var _a;
    if (perspective === 'storyteller') {
        return {
            perspective,
            summary: `说书人视角会结合 ${(_a = scriptPack.displayName) !== null && _a !== void 0 ? _a : scriptPack.zhName} 的控局杠杆、局势压力和公平性风险给出方案型建议。`,
            headlineCards: buildStorytellerHeadlineCards(game, scriptPack),
            sections: buildStorytellerSections(game, scriptPack),
            options: buildStorytellerOptions(scriptPack),
            openingSections: buildStorytellerOpeningSections(game, scriptPack),
            guardrailChecks: buildGuardrailChecks(game, scriptPack),
        };
    }
    if (perspective === 'evil') {
        return {
            perspective,
            summary: '反派视角只基于当前公开信息做策略辅助，不提供说书人真相面板。',
            headlineCards: buildEvilHeadlineCards(game, scriptPack),
            sections: buildEvilSections(game, scriptPack),
        };
    }
    return {
        perspective,
        summary: '正派视角只整理公开信息、矛盾点和行动建议，不暴露任何私密或说书人数据。',
        headlineCards: buildGoodHeadlineCards(game, scriptPack),
        sections: buildGoodSections(game, scriptPack),
    };
}
function buildTroubleBrewingGood(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'good');
    const outsiderExpected = scriptPack.outsiderCount(game.playerCount);
    const outsiderClaims = game.players.filter((player) => {
        const role = player.claimedRole ? scriptPack.roles.find((item) => item.id === player.claimedRole) : null;
        return (role === null || role === void 0 ? void 0 : role.type) === 'outsider';
    }).length;
    return Object.assign(Object.assign({}, base), { summary: '暗流涌动的正派辅助优先关注信息位是否被中毒/醉酒污染、外来者数量是否异常，以及对跳压力是否开始收束成单一路线。', headlineCards: [
            {
                id: 'tb-info-chain',
                title: '信息链健康度',
                value: `${Math.max(claimedPlayers(game).length - issuesWithoutInfo(game, scriptPack).length, 0)} 条可读线`,
                detail: '先看图书管理员、共情、厨师、占卜者这类信息是否还能互相搭桥。',
                tone: 'good',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'tb-good-focus',
                title: '暗流涌动专属重点',
                items: [
                    `外来者宣称当前为 ${outsiderClaims}，预期是 ${outsiderExpected}。若偏差持续存在，要优先怀疑酒鬼、隐士或投毒造成的口径漂移。`,
                    '优先盘“信息位是否被污染”，不要太早把每个错口都当成纯邪恶。',
                    '如果出现强对跳，先追谁能解释昨日信息来源，再决定要不要处决。',
                ],
            },
            ...base.sections,
        ] });
}
function buildTroubleBrewingEvil(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'evil');
    return Object.assign(Object.assign({}, base), { summary: '暗流涌动的反派辅助优先围绕“信息污染 + 对跳风险 + 外来者计数压力”来设计伪装和误导。', headlineCards: [
            {
                id: 'tb-evil-mask',
                title: '更稳伪装路线',
                value: game.currentDay <= 1 ? '中亮信息位' : '可解释对跳位',
                detail: '优先选能解释一轮错误信息、但不会立刻被锁死的身份。',
                tone: 'evil',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'tb-evil-focus',
                title: '暗流涌动专属误导',
                items: [
                    '最有效的误导不是纯乱报，而是把错误归因到“中毒/醉酒/外来者计数异常”。',
                    '如果好人开始围绕单一信息位缩圈，更适合抛出第二条可辩驳信息线，而不是所有人一起对跳。',
                    '保留一个能被明天继续讨论的争议位，比今天硬保所有邪恶位更值钱。',
                ],
            },
            ...base.sections,
        ] });
}
function buildTroubleBrewingStoryteller(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'storyteller');
    return Object.assign(Object.assign({}, base), { summary: '暗流涌动的说书重点是“清晰但不锁死”。让信息链有张力，但不能把好人一夜之间彻底送进死局。', sections: [
            {
                id: 'tb-st-focus',
                title: '暗流涌动控局重点',
                items: [
                    '优先通过投毒、醉酒和对跳制造局内分歧，而不是直接用减员替代讨论。',
                    '教学局更适合给“错得有原因”的信息，让玩家学会盘污染，而不是只觉得自己被戏弄。',
                    '如果好人已经过顺，今晚可以加一层轻污染；如果已经很乱，就要开始回收线索。',
                ],
            },
            ...base.sections,
        ] });
}
function buildBadMoonRisingGood(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'good');
    const nightDeaths = game.players.filter((player) => player.state.diedAtNight).length;
    return Object.assign(Object.assign({}, base), { summary: '暗月初升的正派辅助优先看死亡节奏、保护链和复活空间，不急着把每次死人都盘成单一恶魔能力。', headlineCards: [
            {
                id: 'bmr-death',
                title: '死亡节奏',
                value: `${nightDeaths} 人出现夜死标记`,
                detail: '先确认这是击杀压力、保护失效还是复活前置铺垫。',
                tone: 'warning',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'bmr-good-focus',
                title: '暗月初升专属重点',
                items: [
                    '这板先看“死亡节奏有没有异常”，再看信息位是否出错。',
                    '如果夜里连续死人，不要只追谁像恶魔，也要盘保护链有没有断。',
                    '遇到复活或疑似复活预期时，要保留昨天被否掉的世界线，不要过早删完。',
                ],
            },
            ...base.sections,
        ] });
}
function buildBadMoonRisingEvil(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'evil');
    return Object.assign(Object.assign({}, base), { summary: '暗月初升的反派辅助更看重死亡节奏伪装、保护链穿插和让好人误判恶魔能力方向。', headlineCards: [
            {
                id: 'bmr-evil-route',
                title: '更适合的推进',
                value: game.currentPhase === 'night' ? '埋死亡解释' : '放大节奏恐慌',
                detail: '让好人先争论为什么会死这么多人或这么少人，再争论谁是恶魔。',
                tone: 'evil',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'bmr-evil-focus',
                title: '暗月初升专属误导',
                items: [
                    '最强误导往往不是硬冲身份，而是让好人误判昨夜死亡和保护结果。',
                    '适合保留一个“看起来像能解释死亡节奏”的公开位，让他自然成为讨论核心。',
                    '如果好人开始盘复活空间，邪恶方更该提前准备一条能解释前后口径变化的路线。',
                ],
            },
            ...base.sections,
        ] });
}
function buildBadMoonRisingStoryteller(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'storyteller');
    return Object.assign(Object.assign({}, base), { summary: '暗月初升的说书重点是“死亡有峰值，但讨论不能断”。所有戏剧性操作都要给白天留下抓手。', sections: [
            {
                id: 'bmr-st-focus',
                title: '暗月初升控局重点',
                items: [
                    '这板最强的杠杆是死亡节奏和复活摆幅，但不能连续两晚把讨论空间一起抽空。',
                    '高压局可以让玩家感觉“今晚很危险”，但第二天必须还能追问是谁、为什么、还有没有链条没看见。',
                    '如果局势已经很乱，今晚更适合保留生者数量，改用保护失效或复活预期制造张力。',
                ],
            },
            ...base.sections,
        ] });
}
function buildSectsAndVioletsGood(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'good');
    return Object.assign(Object.assign({}, base), { summary: '梦殒春宵的正派辅助优先处理疯狂、身份变化和阵营变化带来的“旧口径失效”，而不是把每次矛盾都当成纯狼坑。', headlineCards: [
            {
                id: 'sav-state',
                title: '状态扰动面',
                value: `${statefulPlayers(game).length} 个位置有状态压力`,
                detail: '先判断谁的话可能被状态改写，再决定谁更像纯邪恶。',
                tone: 'warning',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'sav-good-focus',
                title: '梦殒春宵专属重点',
                items: [
                    '这板最重要的不是一口气找全真相，而是区分错口到底来自疯狂、醉酒、中毒、换角还是变阵营。',
                    '公开信息冲突出现后，不要立刻把旧世界线全部删掉，要保留一条“如果有人被改写会怎样”的备份线。',
                    '如果某玩家昨天和今天的逻辑像两个人，不一定是硬狼，也可能是角色或阵营变化留下的断层。',
                ],
            },
            ...base.sections,
        ] });
}
function buildSectsAndVioletsEvil(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'evil');
    return Object.assign(Object.assign({}, base), { summary: '梦殒春宵的反派辅助更强调“借状态说话”。高价值误导通常来自疯狂、换角和阵营变化后的可解释错口。', headlineCards: [
            {
                id: 'sav-evil-line',
                title: '更适合的路线',
                value: game.currentDay <= 1 ? '低调埋伏笔' : '借状态搅局',
                detail: '不要纯乱讲，要让每个错口都能挂靠到状态变化或裁定空间。',
                tone: 'evil',
            },
            ...base.headlineCards.slice(0, 2),
        ], sections: [
            {
                id: 'sav-evil-focus',
                title: '梦殒春宵专属误导',
                items: [
                    '最强伪装不是“我没错”，而是“我错得有状态原因”。',
                    '若公开局势已经怀疑有疯狂或换角，邪恶方更适合推动“大家都可能被改写”的氛围，而不是单点硬保。',
                    '优先制造两条都能自洽的解释路线，让好人难以快速锁死唯一世界线。',
                ],
            },
            ...base.sections,
        ] });
}
function buildSectsAndVioletsStoryteller(game, scriptPack) {
    const base = buildGenericAdvice(game, scriptPack, 'storyteller');
    return Object.assign(Object.assign({}, base), { summary: '梦殒春宵的说书重点是“高混乱但可回溯”。疯狂、换角和阵营变化都能做反转，但必须让玩家事后能理解。', sections: [
            {
                id: 'sav-st-focus',
                title: '梦殒春宵控局重点',
                items: [
                    '这板允许高混乱，但每晚最好只强化一种主要干扰，不要把疯狂、换角、变阵营和强污染一起拉满。',
                    '最好的反转是让玩家第二天重新读懂前一天，而不是觉得前一天白玩。',
                    '当公开局势已经非常乱时，今晚要优先回收一条可读线，不要继续堆更多状态。',
                ],
            },
            ...base.sections,
        ] });
}
const scriptModules = {
    trouble_brewing: {
        good: buildTroubleBrewingGood,
        evil: buildTroubleBrewingEvil,
        storyteller: buildTroubleBrewingStoryteller,
    },
    bad_moon_rising: {
        good: buildBadMoonRisingGood,
        evil: buildBadMoonRisingEvil,
        storyteller: buildBadMoonRisingStoryteller,
    },
    sects_and_violets: {
        good: buildSectsAndVioletsGood,
        evil: buildSectsAndVioletsEvil,
        storyteller: buildSectsAndVioletsStoryteller,
    },
};
export function getPerspectiveAdvice(game, scriptPack, perspective = game.mode) {
    const scriptModule = scriptModules[scriptPack.id];
    const builder = scriptModule === null || scriptModule === void 0 ? void 0 : scriptModule[perspective];
    if (builder) {
        return builder(game, scriptPack);
    }
    return buildGenericAdvice(game, scriptPack, perspective);
}
export function getStrategyPackSupportLevel(scriptId) {
    return scriptId in scriptModules ? 'full' : 'meta_only';
}
export function getStrategyPackFocus(scriptId) {
    switch (scriptId) {
        case 'trouble_brewing':
            return '基础信息对抗 / 中毒醉酒 / 对跳压力';
        case 'bad_moon_rising':
            return '死亡节奏 / 保护链 / 复活摆幅';
        case 'sects_and_violets':
            return '疯狂裁定 / 状态变化 / 身份与阵营反转';
        default:
            return '脚本元数据 / 风格模板 / 风险提示';
    }
}
//# sourceMappingURL=strategy.js.map