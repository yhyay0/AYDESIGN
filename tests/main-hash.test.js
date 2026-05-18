const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainScript = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadMainWithHash(hash, existingIds = []) {
    const documentListeners = {};
    const context = {
        console,
        location: { hash },
        localStorage: {
            getItem: () => null,
            removeItem: () => {},
        },
        window: {
            indexedDB: null,
            scrollTo: () => {},
            addEventListener: () => {},
        },
        document: {
            addEventListener: (event, handler) => {
                documentListeners[event] = handler;
            },
            getElementById: (id) => (existingIds.includes(id) ? { id } : null),
            querySelector: () => null,
            querySelectorAll: () => [],
        },
        requestAnimationFrame: (handler) => handler(),
        IntersectionObserver: function IntersectionObserver() {
            return {
                observe: () => {},
                unobserve: () => {},
            };
        },
        setTimeout: (handler) => handler(),
    };

    vm.runInNewContext(mainScript, context, { filename: 'assets/js/main.js' });
    return { context, documentListeners };
}

{
    const { context } = loadMainWithHash('#work', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const { context } = loadMainWithHash('#missing', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const { context } = loadMainWithHash('#%', ['work']);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

