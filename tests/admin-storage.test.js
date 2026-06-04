const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const adminScript = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'admin.js'), 'utf8');
const STORAGE_KEY = 'portfolioData';
const STORAGE_RECORD_MARKER = '__ayPortfolioStorage';

function createLocalStorage(initial = {}) {
    const store = { ...initial };
    return {
        store,
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        }
    };
}

function createIndexedDb(initialRecord, options = {}) {
    const state = {
        stored: initialRecord,
        pendingPuts: []
    };

    const indexedDB = {
        state,
        open() {
            const request = {
                result: null,
                error: null,
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            };

            if (options.failOpen) {
                setImmediate(() => {
                    request.error = new Error('open failed');
                    if (request.onerror) request.onerror();
                });
                return request;
            }

            const db = {
                objectStoreNames: {
                    contains() {
                        return true;
                    }
                },
                createObjectStore() {},
                transaction() {
                    const tx = {
                        error: null,
                        oncomplete: null,
                        onerror: null,
                        onabort: null,
                        objectStore() {
                            return {
                                get() {
                                    const req = {
                                        result: null,
                                        error: null,
                                        onsuccess: null,
                                        onerror: null
                                    };
                                    setImmediate(() => {
                                        req.result = state.stored;
                                        if (req.onsuccess) req.onsuccess();
                                    });
                                    return req;
                                },
                                put(value) {
                                    const req = {
                                        error: null,
                                        onsuccess: null,
                                        onerror: null
                                    };
                                    const completePut = () => {
                                        state.stored = value;
                                        if (req.onsuccess) req.onsuccess();
                                        if (tx.oncomplete) tx.oncomplete();
                                    };
                                    if (options.holdPuts) {
                                        state.pendingPuts.push(completePut);
                                    } else {
                                        setImmediate(completePut);
                                    }
                                    return req;
                                },
                                delete() {
                                    const req = {
                                        error: null,
                                        onsuccess: null,
                                        onerror: null
                                    };
                                    setImmediate(() => {
                                        state.stored = null;
                                        if (req.onsuccess) req.onsuccess();
                                        if (tx.oncomplete) tx.oncomplete();
                                    });
                                    return req;
                                }
                            };
                        }
                    };
                    return tx;
                }
            };

            request.result = db;
            setImmediate(() => {
                if (request.onsuccess) request.onsuccess();
            });
            return request;
        }
    };

    return indexedDB;
}

function loadAdmin({ localStorage, indexedDB = null, now = 1000 } = {}) {
    const context = {
        console,
        setImmediate,
        Date: {
            now() {
                return now;
            }
        },
        window: {
            indexedDB
        },
        document: {
            addEventListener() {},
            getElementById() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            createElement() {
                return {};
            }
        },
        localStorage: localStorage || createLocalStorage(),
        fetch: async () => ({
            ok: false,
            status: 404,
            json: async () => ({})
        }),
        confirm() {
            return true;
        },
        alert() {},
        navigator: {
            clipboard: {
                writeText: async () => {}
            }
        },
        Blob: function Blob() {},
        URL: {
            createObjectURL() {
                return 'blob:test';
            },
            revokeObjectURL() {}
        },
        FileReader: function FileReader() {},
        Image: function Image() {}
    };

    vm.createContext(context);
    vm.runInContext(adminScript, context, { filename: 'assets/js/admin.js' });
    return context;
}

function storageRecord(value, savedAt) {
    return {
        [STORAGE_RECORD_MARKER]: 1,
        savedAt,
        value
    };
}

function cloneForAssert(value) {
    return JSON.parse(JSON.stringify(value));
}

async function waitForPendingPut(indexedDB) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        if (indexedDB.state.pendingPuts.length > 0) return;
        await new Promise((resolve) => setImmediate(resolve));
    }
    throw new Error('Timed out waiting for pending IndexedDB put');
}

(async () => {
    const legacyData = {
        profile: { role: 'Legacy draft' },
        projects: []
    };
    const localStorage = createLocalStorage({
        [STORAGE_KEY]: JSON.stringify(legacyData)
    });
    const noIndexedDbContext = loadAdmin({ localStorage });

    assert.deepEqual(cloneForAssert(await noIndexedDbContext.getStoredData()), legacyData);
    const migratedLocalRecord = JSON.parse(localStorage.getItem(STORAGE_KEY));
    assert.equal(migratedLocalRecord[STORAGE_RECORD_MARKER], 1);
    assert.deepEqual(migratedLocalRecord.value, legacyData);

    const oldData = {
        profile: { role: 'Old IndexedDB draft' },
        projects: []
    };
    const newData = {
        profile: { role: 'New local draft' },
        projects: [{ id: 1, title: 'Recovered edit' }]
    };
    const indexedDB = createIndexedDb(storageRecord(oldData, 10));
    const newerLocalStorage = createLocalStorage({
        [STORAGE_KEY]: JSON.stringify(storageRecord(newData, 20))
    });
    const staleIndexedDbContext = loadAdmin({ localStorage: newerLocalStorage, indexedDB });

    assert.deepEqual(cloneForAssert(await staleIndexedDbContext.getStoredData()), newData);
    assert.deepEqual(cloneForAssert(indexedDB.state.stored.value), newData);
    assert.equal(newerLocalStorage.getItem(STORAGE_KEY), null);

    const heldIndexedDB = createIndexedDb(null, { holdPuts: true });
    const backupLocalStorage = createLocalStorage();
    const pendingContext = loadAdmin({ localStorage: backupLocalStorage, indexedDB: heldIndexedDB, now: 30 });
    const pendingSave = pendingContext.saveStoredData(newData, 30);
    const immediateBackup = JSON.parse(backupLocalStorage.getItem(STORAGE_KEY));
    assert.equal(immediateBackup.savedAt, 30);
    assert.deepEqual(immediateBackup.value, newData);
    await waitForPendingPut(heldIndexedDB);
    heldIndexedDB.state.pendingPuts.splice(0).forEach((complete) => complete());
    await pendingSave;
    assert.equal(backupLocalStorage.getItem(STORAGE_KEY), null);

    console.log('admin storage tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
