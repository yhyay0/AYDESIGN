const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadMainWithHash(hash, ids = []) {
    const idSet = new Set(ids);
    const listeners = {};
    const context = {
        console: {
            error() {},
            warn() {}
        },
        document: {
            addEventListener(event, handler) {
                listeners[event] = handler;
            },
            getElementById(id) {
                return idSet.has(id) ? { id } : null;
            }
        },
        location: { hash },
        localStorage: {
            getItem() { return null; },
            removeItem() {},
            setItem() {}
        },
        requestAnimationFrame(callback) {
            callback();
        },
        window: {
            indexedDB: null,
            scrollTo() {},
            setTimeout(callback) {
                callback();
            },
            addEventListener() {}
        },
        IntersectionObserver: function IntersectionObserver() {}
    };
    context.global = context;
    vm.runInNewContext(source, context, { filename: 'assets/js/main.js' });
    return context;
}

{
    const context = loadMainWithHash('#work', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = loadMainWithHash('#Project%201', ['Project 1']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = loadMainWithHash('#%E0%A4%A', []);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const context = loadMainWithHash('#literal%ZZ', ['literal%ZZ']);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

console.log('scroll-hash tests passed');
