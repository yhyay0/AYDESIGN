const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adminSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'admin.js'), 'utf8');

function createLocalStorage(options = {}) {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            if (options.throwOnSet) {
                throw new Error('localStorage quota exceeded');
            }
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        setRaw(key, value) {
            values.set(key, String(value));
        }
    };
}

function loadAdminSandbox({ indexedDB, localStorage }) {
    const alertMessages = [];
    const sandbox = {
        window: { indexedDB },
        localStorage,
        document: {
            addEventListener() {}
        },
        console: {
            warn() {},
            error() {}
        },
        alert(message) {
            alertMessages.push(message);
        },
        alertMessages
    };
    vm.createContext(sandbox);
    vm.runInContext(adminSource, sandbox, { filename: 'assets/js/admin.js' });
    return sandbox;
}

async function testLocalStorageFallbackKeepsDraftWhenIndexedDbUnsupported() {
    const draft = { profile: { role: 'Draft role' }, projects: [] };
    const serializedDraft = JSON.stringify(draft);
    const localStorage = createLocalStorage();
    localStorage.setRaw('portfolioData', serializedDraft);

    const sandbox = loadAdminSandbox({ indexedDB: undefined, localStorage });
    const loadedDraft = await sandbox.getStoredData();

    assert.deepStrictEqual(JSON.parse(JSON.stringify(loadedDraft)), draft);
    assert.strictEqual(
        localStorage.getItem('portfolioData'),
        serializedDraft,
        'legacy localStorage draft must remain when migration falls back to localStorage'
    );
}

async function testInvalidLocalStorageDraftIsCleared() {
    const localStorage = createLocalStorage();
    localStorage.setRaw('portfolioData', '{invalid json');

    const sandbox = loadAdminSandbox({ indexedDB: undefined, localStorage });
    const loadedDraft = await sandbox.getStoredData();

    assert.strictEqual(loadedDraft, null);
    assert.strictEqual(localStorage.getItem('portfolioData'), null);
}

async function testAutosaveFailureAlertsUser() {
    const localStorage = createLocalStorage({ throwOnSet: true });
    const sandbox = loadAdminSandbox({ indexedDB: undefined, localStorage });
    vm.runInContext("portfolioData = { profile: { role: 'Unsaved draft' }, projects: [] }", sandbox);

    await sandbox.persistPortfolioData();

    assert.deepStrictEqual(sandbox.alertMessages, [
        'Autosave failed. Download or copy the current JSON before leaving this page.'
    ]);
}

(async () => {
    await testLocalStorageFallbackKeepsDraftWhenIndexedDbUnsupported();
    await testInvalidLocalStorageDraftIsCleared();
    await testAutosaveFailureAlertsUser();
    console.log('admin storage tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
