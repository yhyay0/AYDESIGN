const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainScript = fs.readFileSync(path.join(__dirname, '..', 'assets/js/main.js'), 'utf8');

function createContext(hash, existingIds = []) {
    const ids = new Set(existingIds);
    const context = {
        console,
        location: { hash },
        window: {
            scrollTo() {},
            indexedDB: null,
            setTimeout() {}
        },
        document: {
            addEventListener() {},
            getElementById(id) {
                return ids.has(id) ? { id } : null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            }
        },
        requestAnimationFrame(callback) {
            callback();
        },
        localStorage: {
            getItem() {
                return null;
            },
            removeItem() {}
        },
        fetch() {
            return Promise.reject(new Error('fetch is not used by these tests'));
        },
        Image: function Image() {},
        setTimeout() {}
    };
    context.window.setTimeout = context.setTimeout;
    return context;
}

function loadMain(hash, existingIds) {
    const context = createContext(hash, existingIds);
    vm.createContext(context);
    vm.runInContext(mainScript, context, { filename: 'assets/js/main.js' });
    return context;
}

{
    const context = loadMain('#work', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = loadMain('#missing', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const context = loadMain('#%E0%A4%A', ['work']);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

console.log('main hash tests passed');
