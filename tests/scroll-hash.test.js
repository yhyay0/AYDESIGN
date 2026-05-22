const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/main.js'), 'utf8');

function createContext(hash, existingIds = []) {
    const context = {
        console,
        location: { hash },
        window: { scrollTo() {} },
        document: {
            addEventListener() {},
            getElementById(id) {
                return existingIds.includes(id) ? { id } : null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            createElement() {
                return {};
            }
        },
        localStorage: {
            getItem() { return null; },
            removeItem() {},
            setItem() {}
        },
        fetch() {
            return Promise.reject(new Error('not used by these tests'));
        },
        requestAnimationFrame(callback) {
            callback();
        }
    };

    context.window.indexedDB = null;
    context.window.location = context.location;
    context.window.document = context.document;
    return vm.createContext(context);
}

function loadMain(context) {
    vm.runInContext(source, context, { filename: 'assets/js/main.js' });
}

{
    const context = createContext('#work', ['work']);
    loadMain(context);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = createContext('#missing', ['work']);
    loadMain(context);
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const context = createContext('#%E0%A4%A', ['work']);
    loadMain(context);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}
