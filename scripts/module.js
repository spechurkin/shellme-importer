import { importShellMeCharacter, validateShellMeData } from "./shellme-importer.js";

const MODULE_ID = "shellme-importer";

Hooks.on("getActorSheetHeaderButtons", getActorSheetHeaderButtons);

function getActorSheetHeaderButtons(sheet, buttons) {
  if (!game.user.can("FILES_UPLOAD")) return;

  buttons.unshift({
    label: game.i18n.localize("ShellMeImporter.Button"),
    icon: "fa-solid fa-cloud-arrow-down",
    class: "shellme-importer",
    onclick: () => selectAndImportFile(sheet)
  });
}

async function selectAndImportFile(sheet) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.addEventListener("change", async () => {
    const [file] = input.files ?? [];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      validateShellMeData(data);

      ui.notifications.info(
        game.i18n.format("ShellMeImporter.Importing", { name: data.name })
      );

      const actor = await importShellMeCharacter(data, sheet.actor);
      ui.notifications.info(
        game.i18n.format("ShellMeImporter.Complete", { name: actor.name })
      );
    } catch (error) {
      console.error(`${MODULE_ID} | Ошибка импорта`, error);
      ui.notifications.error(
        game.i18n.format("ShellMeImporter.Failed", {
          message: error?.message ?? String(error)
        })
      );
    }
  }, { once: true });

  input.click();
}
