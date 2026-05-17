const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createLocalStorage(initialValues = {}) {
    const store = new Map(Object.entries(initialValues));
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        }
    };
}

function loadAdminScript(localStorage) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/admin.js'), 'utf8');
    const context = {
        console: {
            error: console.error,
            log: console.log,
            warn() {}
        },
        document: {
            addEventListener() {},
            getElementById() {
                return null;
            },
            querySelectorAll() {
                return [];
            }
        },
        localStorage,
        window: {},
        alert() {},
        confirm() {
            return true;
        },
        navigator: {
            clipboard: {
                writeText() {
                    return Promise.resolve();
                }
            }
        },
        requestAnimationFrame(callback) {
            return setTimeout(callback, 0);
        },
        setTimeout,
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(`${source}
globalThis.__adminTestApi = { getStoredData, saveStoredData };`, context, {
        filename: 'assets/js/admin.js'
    });
    return context.__adminTestApi;
}

async function testLocalStorageMigrationKeepsFallbackWhenIndexedDbUnavailable() {
    const storedPortfolio = {
        profile: { role: 'Draft role' },
        projects: [{ id: 1, title: 'Unsaved draft' }]
    };
    const serialized = JSON.stringify(storedPortfolio);
    const localStorage = createLocalStorage({ portfolioData: serialized });
    const { getStoredData } = loadAdminScript(localStorage);

    const result = await getStoredData();

    assert.deepEqual(result, storedPortfolio);
    assert.equal(
        localStorage.getItem('portfolioData'),
        serialized,
        'localStorage fallback should remain when migration cannot reach IndexedDB'
    );
}

async function run() {
    await testLocalStorageMigrationKeepsFallbackWhenIndexedDbUnavailable();
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
