const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'assets/js/main.js'), 'utf8');

function createContext(targetIds = []) {
    const ids = new Set(targetIds);
    const context = {
        console,
        location: { hash: '' },
        window: {
            scrollTo() {},
            addEventListener() {},
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
            },
            body: { style: {} }
        },
        localStorage: {
            getItem() {
                return null;
            },
            removeItem() {}
        },
        requestAnimationFrame() {},
        IntersectionObserver: function IntersectionObserver() {}
    };

    context.window.location = context.location;
    context.window.document = context.document;
    context.window.localStorage = context.localStorage;
    vm.createContext(context);
    vm.runInContext(script, context, { filename: 'assets/js/main.js' });
    return context;
}

{
    const context = createContext(['work']);
    context.location.hash = '#work';
    assert.equal(context.hasInPageAnchorTarget(), true);
}

{
    const context = createContext(['work']);
    context.location.hash = '#missing';
    assert.equal(context.hasInPageAnchorTarget(), false);
}

{
    const context = createContext(['work']);
    context.location.hash = '#%E0%A4%A';
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.equal(context.hasInPageAnchorTarget(), false);
}

