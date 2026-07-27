const PREFIX = "shellme-importer";

export function logAction(action, details) {
    if (details === undefined) {
        console.info(`${PREFIX} | ${action}`);
        return;
    }
    console.info(`${PREFIX} | ${action}`, details);
}

export function logWarning(action, details) {
    if (details === undefined) {
        console.warn(`${PREFIX} | ${action}`);
        return;
    }
    console.warn(`${PREFIX} | ${action}`, details);
}

export function logError(action, error, details) {
    if (details === undefined) {
        console.error(`${PREFIX} | ${action}`, error);
        return;
    }
    console.error(`${PREFIX} | ${action}`, details, error);
}
