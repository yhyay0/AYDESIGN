const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'assets/js/main.js'), 'utf8');

async function runStartup(hash, targetIds = []) {
    const listeners = {};
    let scrollCount = 0;
    let initCalled = false;

    const context = {
        console,
        location: { hash },
        history: {},
        window: {
            scrollTo: () => {
                scrollCount += 1;
            },
            setTimeout,
            clearTimeout,
            indexedDB: null
        },
        document: {
            addEventListener: (eventName, handler) => {
                listeners[eventName] = handler;
            },
            getElementById: (id) => (targetIds.includes(id) ? { id } : null),
            querySelector: () => null,
            querySelectorAll: () => []
        },
        requestAnimationFrame: (callback) => callback(),
        setTimeout,
        clearTimeout,
        alert: () => {}
    };

    vm.createContext(context);
    vm.runInContext(script, context, { filename: 'assets/js/main.js' });
    context.initApp = () => {
        initCalled = true;
        return Promise.resolve();
    };

    assert.strictEqual(typeof listeners.DOMContentLoaded, 'function');
    assert.doesNotThrow(() => listeners.DOMContentLoaded());

    await Promise.resolve();

    return { scrollCount, initCalled };
}

(async () => {
    const malformed = await runStartup('#%E0%A4%A');
    assert.strictEqual(malformed.initCalled, true, 'malformed hash should not stop app startup');
    assert.strictEqual(malformed.scrollCount, 2, 'malformed hash should be treated as no valid target');

    const validTarget = await runStartup('#work', ['work']);
    assert.strictEqual(validTarget.initCalled, true, 'valid hash should still start the app');
    assert.strictEqual(validTarget.scrollCount, 0, 'valid in-page target should keep browser anchor scroll');
})();
