import {logAction, logError, logWarning} from "./logger.js";

const SYSTEM_ID = "cyberpunk-red-core";

const STAT_MAP = {
    INT: "int",
    REF: "ref",
    DEX: "dex",
    TECH: "tech",
    COOL: "cool",
    WILL: "will",
    LUCK: "luck",
    MOVE: "move",
    BODY: "body",
    EMP: "emp"
};

const ROLE_DEFINITIONS = {
    rockerboy: {name: "Rockerboy", ru: "Рокербой", key: "rockerboy"},
    solo: {name: "Solo", ru: "Соло", key: "solo"},
    netrunner: {name: "Netrunner", ru: "Нетраннер", key: "netrunner"},
    tech: {name: "Tech", ru: "Техник", key: "tech"},
    medtech: {name: "Medtech", ru: "Медтехник", key: "medtech"},
    media: {name: "Media", ru: "Журналист", key: "media"},
    lawman: {name: "Lawman", ru: "Законник", key: "lawman"},
    exec: {name: "Exec", ru: "Менеджер", key: "exec"},
    fixer: {name: "Fixer", ru: "Фиксер", key: "fixer"},
    nomad: {name: "Nomad", ru: "Кочевник", key: "nomad"}
};

const SKILL_NAME_MAP = {
    "Вождение": "Drive Land Vehicle",
    "Верховая езда": "Riding",
    "Судоходство": "Pilot Sea Vehicle",
    "Пилотирование": "Pilot Air Vehicle",
    "Образование": "Education",
    "Наука": "Science",
    "Азартные игры": "Gamble",
    "Бизнес": "Business",
    "Бухгалтерия": "Accounting",
    "Бюрократия": "Bureaucracy",
    "Дедукция": "Deduction",
    "Криминология": "Criminology",
    "Поиск информации": "Library Search",
    "Криптография": "Cryptography",
    "Композиция": "Composition",
    "Тактика": "Tactics",
    "Знание местности": "Local Expert",
    "Выживание в пустыне": "Wilderness Survival",
    "Обращение с животными": "Animal Handling",
    "Язык": "Language (Streetslang)",
    "Уклонение": "Evasion",
    "Рукопашный бой": "Brawling",
    "Оружие ближнего боя": "Melee Weapon",
    "Боевые искусства": "Martial Arts",
    "Концентрация": "Concentration",
    "Внимательность": "Perception",
    "Выслеживание": "Tracking",
    "Чтение по губам": "Lip Reading",
    "Скрытие/раскрытие объекта": "Conceal/Reveal Object",
    "Актерское мастерство": "Acting",
    "Игра на инструменте": "Play Instrument",
    "Атлетика": "Athletics",
    "Скрытность": "Stealth",
    "Акробатика": "Contortionist",
    "Танец": "Dance",
    "Выносливость": "Endurance",
    "Сопротивление пыткам/наркотикам": "Resist Torture/Drugs",
    "Пистолеты": "Handgun",
    "Тактическое оружие": "Shoulder Arms",
    "Стрельба из лука": "Archery",
    "Оружие тяжелого калибра": "Heavy Weapons",
    "Автоматический огонь": "Autofire",
    "Общение": "Conversation",
    "Проницательность": "Human Perception",
    "Убеждение": "Persuasion",
    "Допрос": "Interrogation",
    "Знание Улиц": "Streetwise",
    "Подкуп": "Bribery",
    "Торговля": "Trading",
    "Уход за собой": "Personal Grooming",
    "Гардероб и стиль": "Wardrobe & Style",
    "Первая помощь": "First Aid",
    "Парамедик (x2)": "Paramedic",
    "Знание техники": "Basic Tech",
    "Кибертехника": "Cybertech",
    "Электроника/Безопасность (x2)": "Electronics/Security Tech",
    "Оружейник": "Weaponstech",
    "Подрывник (x2)": "Demolitions",
    "Автомеханика": "Land Vehicle Tech",
    "Авиационные технологии": "Air Vehicle Tech",
    "Морские технологии": "Sea Vehicle Tech",
    "Взлом замков": "Pick Lock",
    "Карманник": "Pick Pocket",
    "Фальсификация": "Forgery",
    "Кино- и фототехника": "Photography/Film",
    "Художественное ремесло": "Paint/Draw/Sculpt"
};

const SPECIAL_SKILLS = {
    "Наука": {
        prefix: "Наука",
        stat: "int",
        category: "educationSkills",
        difficulty: "difficult",
        skillType: "science"
    },
    "Знание местности": {
        prefix: "Знание местности",
        stat: "int",
        category: "educationSkills",
        difficulty: "typical",
        skillType: "localExpert"
    },
    "Язык": {
        prefix: "Язык",
        stat: "int",
        category: "educationSkills",
        difficulty: "typical",
        skillType: "language"
    },
    "Боевые искусства": {
        prefix: "Martial Arts",
        stat: "dex",
        category: "fightingSkills",
        difficulty: "difficult",
        skillType: "martialArt"
    },
    "Игра на инструменте": {
        prefix: "Игра на инструменте",
        stat: "tech",
        category: "performanceSkills",
        difficulty: "typical",
        skillType: "playInstrument"
    }
};

function normalize(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(/ё/g, "е")
        .replace(/\s*\(x\d+\)\s*$/i, "")
        .replace(/[^a-zа-я0-9]+/gi, "");
}

function parseItemReference(value) {
    const rawName = typeof value === "string"
        ? value
        : value?.name ?? value?.equipment;
    if (!rawName) return {};

    const quantityMatch = String(rawName).match(/\s+[xх×]\s*(\d+)\s*$/iu);
    const name = quantityMatch
        ? String(rawName).slice(0, quantityMatch.index).trim()
        : String(rawName).trim();
    const explicitQuantity = typeof value === "object"
        ? optionalNumber(value.quantity ?? value.amount)
        : undefined;

    return {
        name,
        quantity: explicitQuantity ?? numberValue(quantityMatch?.[1], 1)
    };
}

function numberValue(value, fallback = 0) {
    const candidate = value && typeof value === "object"
        ? value.current ?? value.value
        : value;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    const match = String(value).replace(/[\s,_]/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return undefined;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function textToHtml(value) {
    if (value === null || value === undefined || value === "") return "";
    if (Array.isArray(value)) {
        return value.map(textToHtml).filter(Boolean).join("<hr>");
    }
    if (typeof value === "object") {
        return Object.entries(value)
            .filter(([, itemValue]) => itemValue !== "" && itemValue !== null && itemValue !== undefined)
            .map(([key, itemValue]) => `<strong>${escapeHtml(key)}:</strong> ${textToHtml(itemValue)}`)
            .join("<br>");
    }
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function getRoleDefinition(roleValue) {
    const roleName = normalize(roleValue);
    if (!roleName || roleName === "никто" || roleName === "none") return undefined;

    return Object.values(ROLE_DEFINITIONS).find((role) =>
        [role.key, role.name, role.ru].some((candidate) => normalize(candidate) === roleName)
    );
}

function roleAliases(role) {
    const localized = game.i18n.localize(`CPR.global.role.${role.key}.name`);
    return [...new Set([role.ru, localized, role.name].filter(Boolean))];
}

function quickInsertApi() {
    return globalThis.QuickInsert ?? globalThis.window?.QuickInsert;
}

async function getQuickInsertRole(roleValue) {
    const role = getRoleDefinition(roleValue);
    if (!role) {
        logAction("Роль отсутствует, импорт роли пропущен");
        return undefined;
    }

    logAction("Поиск роли через Quick Insert", {role: role.ru});
    const selected = await findQuickInsertDocument(roleAliases(role), ["role"]);
    if (!selected) {
        logWarning("Роль не найдена", {role: role.ru});
        throw new Error(
            game.i18n.format("ShellMeImporter.RoleNotFound", {role: role.ru})
        );
    }
    logAction("Роль найдена", {
        requestedName: role.ru,
        itemName: selected.name,
        uuid: selected.uuid
    });
    return selected;
}

async function findQuickInsertDocument(names, allowedTypes) {
    const searchNames = [...new Set((Array.isArray(names) ? names : [names]).filter(Boolean))];
    if (searchNames.length === 0) return undefined;

    const quickInsert = quickInsertApi();
    if (!quickInsert) {
        logWarning("Quick Insert недоступен", {
            names: searchNames,
            allowedTypes
        });
        throw new Error(game.i18n.localize("ShellMeImporter.QuickInsertMissing"));
    }
    if (!quickInsert.hasIndex) {
        logAction("Индексация Quick Insert запущена");
        await quickInsert.forceIndex();
        logAction("Индексация Quick Insert завершена");
    }

    const candidates = new Map();
    for (const searchName of searchNames) {
        for (const result of quickInsert.search(searchName) ?? []) {
            if (normalize(result.item?.name) !== normalize(searchName)) continue;
            const document = await result.item.get();
            if (!document || !allowedTypes.includes(document.type)) continue;
            candidates.set(document.uuid, document);
        }
    }

    const uniqueCandidates = [...candidates.values()];
    const systemRole = uniqueCandidates.find((item) =>
        item.pack?.metadata?.packageName === SYSTEM_ID
        || String(item.uuid).startsWith(`Compendium.${SYSTEM_ID}.`)
    );
    const automaticMatch = systemRole ?? uniqueCandidates[0];
    if (automaticMatch) {
        logAction("Quick Insert: найдено автоматическое совпадение", {
            requestedName: searchNames[0],
            itemName: automaticMatch.name,
            itemType: automaticMatch.type,
            uuid: automaticMatch.uuid
        });
        return automaticMatch;
    }

    logAction("Quick Insert: открыт ручной выбор", {
        requestedName: searchNames[0],
        allowedTypes
    });
    return chooseQuickInsertDocument(searchNames[0], allowedTypes, quickInsert);
}

function chooseQuickInsertDocument(searchName, allowedTypes, quickInsert) {
    return new Promise((resolve, reject) => {
        let submitted = false;

        function openSearchDialogue(retries = 0) {
            if (quickInsert.app?.rendered || quickInsert.app?.visible) {
                if (retries > 20) {
                    reject(new Error("Quick Insert не закрыл предыдущее окно поиска за 2 секунды."));
                    return;
                }
                setTimeout(() => openSearchDialogue(retries + 1), 100);
                return;
            }

            try {
                quickInsert.open({
                    mode: 1,
                    classes: ["shellme-importer-quick-insert"],
                    startText: searchName,
                    allowMultiple: false,
                    restrictTypes: ["Item"],
                    onSubmit: async (item) => {
                        submitted = true;
                        try {
                            const document = await item.get();
                            if (allowedTypes.includes(document?.type)) {
                                logAction("Quick Insert: выбран предмет вручную", {
                                    requestedName: searchName,
                                    itemName: document.name,
                                    itemType: document.type,
                                    uuid: document.uuid
                                });
                                resolve(document);
                                return;
                            }
                            logWarning("Quick Insert: выбран неподходящий тип предмета", {
                                requestedName: searchName,
                                itemName: document?.name,
                                itemType: document?.type,
                                allowedTypes
                            });
                            resolve(undefined);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onClose: () => {
                        if (!submitted) {
                            logAction("Quick Insert: ручной выбор отменён", {
                                requestedName: searchName
                            });
                            resolve(undefined);
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        }

        openSearchDialogue();
    });
}

function actorItemData(document, systemUpdates = {}) {
    const data = document.toObject
        ? document.toObject()
        : foundry.utils.deepClone(document);
    delete data._id;
    delete data.folder;
    delete data.sort;
    data.system = foundry.utils.mergeObject(
        data.system ?? {},
        systemUpdates,
        {inplace: false}
    );
    return data;
}

function roleItemData(document, rank) {
    return actorItemData(document, {rank: numberValue(rank)});
}

function actorUpdateData(data) {
    const update = {};

    for (const [shellName, systemName] of Object.entries(STAT_MAP)) {
        const source = data.stats?.[shellName];
        update[`system.stats.${systemName}.value`] = numberValue(source);
        if (shellName === "LUCK" || shellName === "EMP") {
            update[`system.stats.${systemName}.max`] = numberValue(source?.max ?? source);
        }
    }

    update["system.derivedStats.hp.value"] = numberValue(data.health?.current);
    update["system.derivedStats.hp.max"] = numberValue(data.health?.max);
    update["system.derivedStats.humanity.value"] = numberValue(data.humanity?.current);
    update["system.derivedStats.humanity.max"] = numberValue(data.humanity?.max);
    update["system.improvementPoints.value"] = numberValue(data.improvementPoints?.current);
    update["system.reputation.value"] = numberValue(data.lifepath?.reputation);
    update["system.wealth.value"] = numberValue(data.lifepath?.money);
    update["system.improvementPoints.transactions"] = [[
        `Установлено при импорте из ShellMe: ${numberValue(data.improvementPoints?.current)} ОУ.`,
        "ShellMe"
    ]];
    update["system.reputation.transactions"] = [[
        textToHtml(data.lifepath?.reputationEvents)
        || `Установлено при импорте из ShellMe: ${numberValue(data.lifepath?.reputation)}.`,
        "ShellMe"
    ]];
    update["system.wealth.transactions"] = [[
        `Установлено при импорте из ShellMe: ${numberValue(data.lifepath?.money)} eb.`,
        "ShellMe"
    ]];

    const lifepath = data.lifepath ?? {};
    const lifepathMap = {
        culture: "culturalOrigin",
        personality: "personality",
        style: "clothingStyle",
        hair: "hairStyle",
        value: "valueMost",
        people: "aboutPeople",
        closePerson: "valuedPerson",
        valuable: "valuedPossession",
        family: "familyBackground",
        childhood: "childhoodEnvironment",
        crisis: "familyCrisis",
        friends: "friends",
        enemies: "enemies",
        tragicRomances: "tragicLoveAffairs",
        goal: "lifeGoals",
        rolePath: "roleLifepath"
    };
    for (const [shellName, systemName] of Object.entries(lifepathMap)) {
        update[`system.lifepath.${systemName}`] = textToHtml(lifepath[shellName]);
    }

    update["system.lifestyle.housing.description"] = textToHtml(lifepath.home);
    update["system.lifestyle.lifeStyle.description"] = textToHtml(lifepath.lifestyle);
    const rent = optionalNumber(lifepath.rent);
    if (rent !== undefined) update["system.lifestyle.housing.cost"] = rent;

    const noteSections = [
        ["Критические травмы", data.criticalInjuries],
        ["Зависимости", data.dependencies],
        ["Тяжёлое ранение", data.health?.heavy_injury],
        ["Спасбросок", data.health?.saving_throw],
        ["Боеприпасы", lifepath.ammo]
    ];
    update["system.information.notes"] = noteSections
        .filter(([, value]) => value !== "" && value !== null && value !== undefined)
        .map(([label, value]) => `<p><strong>${label}:</strong><br>${textToHtml(value)}</p>`)
        .join("");

    return update;
}

function allShellMeSkills(data) {
    return Object.values(data.skills ?? {})
        .filter(Array.isArray)
        .flat();
}

function findActorSkill(actor, ...names) {
    const candidates = new Set(names.filter(Boolean).map(normalize));
    return actor.itemTypes.skill.find((item) => candidates.has(normalize(item.name)));
}

function getChildSkillName(parent, child) {
    const name = typeof child === "string" ? child : child?.name;
    if (!name) return undefined;
    if (normalize(name).startsWith(normalize(parent.prefix))) return name;
    return `${parent.prefix} (${name})`;
}

async function importSkills(data, actor) {
    const updates = [];
    const creates = [];

    for (const skill of allShellMeSkills(data)) {
        if (!skill?.name) continue;
        const canonicalName = SKILL_NAME_MAP[skill.name] ?? skill.name;
        const actorSkill = findActorSkill(actor, canonicalName, skill.name);
        if (actorSkill) {
            updates.push({_id: actorSkill.id, "system.level": numberValue(skill.level)});
        }

        const special = SPECIAL_SKILLS[skill.name];
        if (!special || !Array.isArray(skill.children)) continue;

        for (const child of skill.children) {
            const childName = getChildSkillName(special, child);
            if (!childName) continue;
            const childLevel = numberValue(
                typeof child === "object" ? child.level ?? child.value : skill.level
            );
            const existing = findActorSkill(actor, childName, child?.name);
            if (existing) {
                updates.push({_id: existing.id, "system.level": childLevel});
            } else {
                creates.push({
                    name: childName,
                    type: "skill",
                    system: {
                        level: childLevel,
                        stat: special.stat,
                        category: special.category,
                        difficulty: special.difficulty,
                        skillType: special.skillType,
                        core: false,
                        basic: false
                    }
                });
            }
        }
    }

    if (updates.length > 0) await actor.updateEmbeddedDocuments("Item", updates);
    if (creates.length > 0) await actor.createEmbeddedDocuments("Item", creates);
    return {updated: updates.length, created: creates.length};
}

const IMPORTABLE_ITEM_TYPES = [
    "ammo",
    "armor",
    "clothing",
    "cyberdeck",
    "cyberware",
    "drug",
    "gear",
    "itemUpgrade",
    "program",
    "vehicle",
    "weapon"
];

function itemDescriptionWithNote(itemData, note) {
    if (!note) return;
    const current = itemData.system?.description?.value ?? "";
    itemData.system.description = {
        value: [current, `<p><strong>ShellMe:</strong><br>${textToHtml(note)}</p>`]
            .filter(Boolean)
            .join("")
    };
}

async function quickInsertItemData(data) {
    const items = [];
    const missing = [];
    const armor = data.armor ?? {};

    for (const [location, armorData] of Object.entries(armor)) {
        if (!armorData?.name) continue;
        const document = await findQuickInsertDocument(armorData.name, ["armor"]);
        if (!document) {
            missing.push(armorData.name);
            continue;
        }
        const sp = numberValue(armorData.oc);
        const isShield = location === "shield";
        items.push(actorItemData(document, {
            penalty: numberValue(armorData.penalty),
            isBodyLocation: location === "body",
            isHeadLocation: location === "head",
            isShield,
            bodyLocation: {sp: location === "body" ? sp : 0, ablation: 0},
            headLocation: {sp: location === "head" ? sp : 0, ablation: 0},
            shieldHitPoints: {value: isShield ? sp : 0, max: isShield ? sp : 0},
            equipped: "equipped"
        }));
    }

    for (const weapon of data.weapons ?? []) {
        if (!weapon?.name) continue;
        const document = await findQuickInsertDocument(weapon.name, ["weapon"]);
        if (!document) {
            missing.push(weapon.name);
            continue;
        }
        const notes = [weapon.notes, weapon.ammo ? `Боеприпасы: ${weapon.ammo}` : ""]
            .filter(Boolean)
            .join("\n");
        const itemData = actorItemData(document);
        itemDescriptionWithNote(itemData, notes);
        items.push(itemData);
    }

    for (const equipment of data.lifepath?.equipment ?? []) {
        const {name, quantity} = parseItemReference(equipment);
        if (!name) continue;
        const document = await findQuickInsertDocument(name, IMPORTABLE_ITEM_TYPES);
        if (!document) {
            missing.push(name);
            continue;
        }
        const description = typeof equipment === "object"
            ? equipment.description ?? equipment.notes ?? equipment.info
            : "";
        const itemData = actorItemData(document);
        if (itemData.system.amount !== undefined) {
            itemData.system.amount = quantity;
        }
        itemDescriptionWithNote(itemData, description);
        items.push(itemData);
    }

    for (const cyberwareList of Object.values(data.cyberware ?? {})) {
        if (!Array.isArray(cyberwareList)) continue;
        for (const cyberware of cyberwareList) {
            const name = typeof cyberware === "string"
                ? cyberware
                : cyberware?.name ?? cyberware?.implant;
            if (!name) continue;
            const document = await findQuickInsertDocument(name, ["cyberware"]);
            if (!document) {
                missing.push(name);
                continue;
            }
            const info = typeof cyberware === "object"
                ? cyberware.info ?? cyberware.description ?? cyberware.notes
                : "";
            const itemData = actorItemData(document);
            itemDescriptionWithNote(itemData, info);
            items.push(itemData);
        }
    }

    return {items, missing: [...new Set(missing)]};
}

export function validateShellMeData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(game.i18n.localize("ShellMeImporter.InvalidJson"));
    }
    if (typeof data.name !== "string" || !data.name.trim()) {
        throw new Error(game.i18n.localize("ShellMeImporter.InvalidName"));
    }
    if (!data.stats || typeof data.stats !== "object") {
        throw new Error(game.i18n.localize("ShellMeImporter.InvalidStats"));
    }
    return true;
}

export async function importShellMeCharacter(data, actor) {
    logAction("Проверка данных импорта", {
        actorId: actor?.id,
        actorName: actor?.name,
        characterName: data?.name
    });
    validateShellMeData(data);
    if (game.system.id !== SYSTEM_ID) {
        throw new Error(game.i18n.localize("ShellMeImporter.WrongSystem"));
    }
    if (!actor || (actor.type !== "character" && actor.type !== "mook")) {
        throw new Error(game.i18n.localize("ShellMeImporter.WrongActorType"));
    }
    logAction("Данные импорта прошли проверку", {
        actorId: actor.id,
        actorName: actor.name,
        actorType: actor.type,
        characterName: data.name.trim()
    });

    try {
        logAction("Обновление данных актёра", {
            actorId: actor.id,
            oldName: actor.name,
            newName: data.name.trim()
        });
        await actor.update({
            name: data.name.trim(),
            ...actorUpdateData(data)
        });
        logAction("Данные актёра обновлены", {
            actorId: actor.id,
            actorName: actor.name
        });

        logAction("Импорт навыков запущен", {actorId: actor.id});
        const skillImport = await importSkills(data, actor);
        logAction("Импорт навыков завершён", {
            actorId: actor.id,
            updated: skillImport.updated,
            created: skillImport.created
        });

        logAction("Quick Insert запущен", {actorId: actor.id});
        const roleDocument = await getQuickInsertRole(data.role);
        logAction("Поиск предметов через Quick Insert запущен");
        const itemImport = await quickInsertItemData(data);
        logAction("Поиск предметов через Quick Insert завершён", {
            found: itemImport.items.length,
            missing: itemImport.missing.length
        });

        if (roleDocument) {
            logAction("Добавление роли", {
                actorId: actor.id,
                roleName: roleDocument.name,
                rank: numberValue(data.rank)
            });
            await actor.createEmbeddedDocuments("Item", [roleItemData(roleDocument, data.rank)]);
            logAction("Роль добавлена", {
                actorId: actor.id,
                roleName: roleDocument.name
            });
        }

        if (itemImport.items.length > 0) {
            logAction("Добавление предметов", {
                actorId: actor.id,
                count: itemImport.items.length
            });
            await actor.createEmbeddedDocuments("Item", itemImport.items);
            logAction("Предметы добавлены", {
                actorId: actor.id,
                count: itemImport.items.length
            });
        }
        if (itemImport.missing.length > 0) {
            logWarning("Некоторые предметы не импортированы", {
                actorId: actor.id,
                items: itemImport.missing
            });
            ui.notifications.warn(
                game.i18n.format("ShellMeImporter.ItemsNotFound", {
                    items: itemImport.missing.join(", ")
                })
            );
        }
        logAction("Блок Quick Insert завершён", {
            actorId: actor.id,
            roleAdded: Boolean(roleDocument),
            itemsAdded: itemImport.items.length,
            itemsMissing: itemImport.missing.length
        });
        logAction("Все действия импорта выполнены", {
            actorId: actor.id,
            actorName: actor.name,
            skillsUpdated: skillImport.updated,
            skillsCreated: skillImport.created,
            roleAdded: Boolean(roleDocument),
            itemsAdded: itemImport.items.length,
            itemsMissing: itemImport.missing.length
        });
        return actor;
    } catch (error) {
        logError("Персонаж импортирован частично", error, {
            actorId: actor.id,
            actorName: actor.name
        });
        throw error;
    }
}

export const __testables = {
    actorUpdateData,
    getRoleDefinition,
    normalize,
    parseItemReference,
    quickInsertItemData,
    textToHtml
};
