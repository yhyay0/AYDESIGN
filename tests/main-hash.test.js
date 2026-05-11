const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function loadMainContext(hash, getElementById = () => null) {
    const context = {
        console: {
            error() {},
            warn() {}
        },
        document: {
            addEventListener() {},
            getElementById
        },
        location: { hash },
        localStorage: {
            getItem: () => null,
            removeItem() {}
        },
        requestAnimationFrame() {},
        window: {
            indexedDB: null,
            scrollTo() {},
            setTimeout
        }
    };
    vm.createContext(context);
    vm.runInContext(readFileSync('assets/js/main.js', 'utf8'), context);
    return context;
}

test('malformed URL hash does not throw while checking anchor targets', () => {
    const context = loadMainContext('#100%');

    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.equal(context.hasInPageAnchorTarget(), false);
});

test('valid encoded hash still resolves matching in-page anchors', () => {
    const context = loadMainContext('#work%20section', (id) => id === 'work section' ? {} : null);

    assert.equal(context.hasInPageAnchorTarget(), true);
});
