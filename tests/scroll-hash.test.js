const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadWithHash(hash, knownIds = []) {
    const context = {
        console,
        location: { hash },
        window: {
            scrollTo() {},
            indexedDB: null
        },
        document: {
            addEventListener() {},
            getElementById(id) {
                return knownIds.includes(id) ? { id } : null;
            }
        },
        requestAnimationFrame(callback) {
            callback();
        },
        fetch: async () => {
            throw new Error('fetch should not be called in hash helper tests');
        },
        localStorage: {
            getItem() {
                return null;
            },
            removeItem() {}
        }
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'assets/js/main.js' });
    return context;
}

{
    const context = loadWithHash('#work', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), true);
}

{
    const context = loadWithHash('#missing', ['work']);
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

{
    const context = loadWithHash('#%E0%A4%A', ['work']);
    assert.doesNotThrow(() => context.hasInPageAnchorTarget());
    assert.strictEqual(context.hasInPageAnchorTarget(), false);
}

console.log('scroll hash tests passed');
