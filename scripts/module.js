import {importShellMeCharacter, validateShellMeData} from "./shellme-importer.js";
import {logAction, logError} from "./logger.js";

Hooks.on("getActorSheetHeaderButtons", getActorSheetHeaderButtons);

function getActorSheetHeaderButtons(sheet, buttons) {
    if (!game.user.can("FILES_UPLOAD")) return;

    buttons.unshift({
        label: game.i18n.localize("ShellMeImporter.Button"),
        icon: "fa-solid fa-cloud-arrow-down",
        class: "shellme-importer",
        onclick: () => {
            logAction("Открыт выбор файла", actorDetails(sheet.actor));
            return selectAndImportFile(sheet);
        }
    });
}

function actorDetails(actor) {
    return {
        actorId: actor?.id,
        actorName: actor?.name,
        actorType: actor?.type
    };
}

async function selectAndImportFile(sheet) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", async () => {
        const [file] = input.files ?? [];
        if (!file) {
            logAction("Файл не выбран", actorDetails(sheet.actor));
            return;
        }

        try {
            logAction("Выбран файл", {
                ...actorDetails(sheet.actor),
                fileName: file.name,
                fileSize: file.size
            });

            const fileContents = await file.text();
            logAction("Файл прочитан", {
                fileName: file.name,
                characters: fileContents.length
            });

            const data = JSON.parse(fileContents);
            validateShellMeData(data);
            logAction("JSON проверен", {
                fileName: file.name,
                characterName: data.name
            });

            ui.notifications.info(
                game.i18n.format("ShellMeImporter.Importing", {name: data.name})
            );

            logAction("Запущен импорт", {
                ...actorDetails(sheet.actor),
                characterName: data.name
            });
            const actor = await importShellMeCharacter(data, sheet.actor, sheet);
            logAction("Импорт завершён", actorDetails(actor));
            ui.notifications.info(
                game.i18n.format("ShellMeImporter.Complete", {name: actor.name})
            );
        } catch (error) {
            logError("Ошибка импорта", error, actorDetails(sheet.actor));
            ui.notifications.error(
                game.i18n.format("ShellMeImporter.Failed", {
                    message: error?.message ?? String(error)
                })
            );
        }
    }, {once: true});

    input.click();
}
