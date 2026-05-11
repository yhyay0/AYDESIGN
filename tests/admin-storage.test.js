const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function loadAdminContext(localStorage) {
    const context = {
        console: {
            error() {},
            warn() {}
        },
        document: {
            addEventListener() {}
        },
        localStorage,
        window: {
            indexedDB: null
        }
    };
    vm.createContext(context);
    vm.runInContext(readFileSync('assets/js/admin.js', 'utf8'), context);
    return context;
}

test('keeps legacy localStorage data when IndexedDB is unavailable', async () => {
    const saved = { profile: { role: 'Designer' }, projects: [] };
    const storage = new Map([['portfolioData', JSON.stringify(saved)]]);
    const localStorage = {
        getItem: (key) => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key)
    };
    const context = loadAdminContext(localStorage);

    const data = await context.getStoredData();

    assert.deepEqual(data, saved);
    assert.equal(storage.get('portfolioData'), JSON.stringify(saved));
}

test('does not delete valid legacy data when fallback persistence fails', async () => {
    const saved = { profile: { role: 'Designer' }, projects: [] };
    const serialized = JSON.stringify(saved);
    let removed = false;
    const localStorage = {
        getItem: (key) => key === 'portfolioData' ? serialized : null,
        setItem: () => {
            throw new Error('quota exceeded');
        },
        removeItem: () => {
            removed = true;
        }
    };
    const context = loadAdminContext(localStorage);

    const data = await context.getStoredData();

    assert.deepEqual(data, saved);
    assert.equal(removed, false);
}

test('clears invalid legacy localStorage JSON', async () => {
    let removed = false;
    const localStorage = {
        getItem: (key) => key === 'portfolioData' ? '{bad json' : null,
        setItem() {},
        removeItem: () => {
            removed = true;
        }
    };
    const context = loadAdminContext(localStorage);

    const data = await context.getStoredData();

    assert.equal(data, null);
    assert.equal(removed, true);
}
