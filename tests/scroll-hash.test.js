const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadContext(hash, existingIds = []) {
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
        localStorage: {
            getItem() {
                return null;
            },
            removeItem() {}
        },
        requestAnimationFrame(callback) {
            callback();
        },
        IntersectionObserver: function IntersectionObserver() {
            return {
                observe() {},
                unobserve() {}
            };
        }
    };

    vm.runInNewContext(mainJs, context, { filename: 'assets/js/main.js' });
    return context;
}

assert.doesNotThrow(() => {
    const context = loadContext('#%E0%A4%A');
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
});

{
    const context = loadContext('#work', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = loadContext('#missing', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const context = loadContext('#');
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}
