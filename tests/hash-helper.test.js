const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/main.js'), 'utf8');
const existingIds = new Set(['work']);

const context = {
    console,
    location: { hash: '' },
    window: {
        scrollTo() {},
        indexedDB: null,
        setTimeout() {}
    },
    document: {
        addEventListener() {},
        getElementById(id) {
            return existingIds.has(id) ? { id } : null;
        }
    },
    requestAnimationFrame() {}
};

vm.createContext(context);
vm.runInContext(source, context, { filename: 'assets/js/main.js' });

context.location.hash = '#work';
assert.equal(context.hasInPageAnchorTarget(), true);

context.location.hash = '#missing';
assert.equal(context.hasInPageAnchorTarget(), false);

context.location.hash = '#%';
assert.doesNotThrow(() => context.hasInPageAnchorTarget());
assert.equal(context.hasInPageAnchorTarget(), false);

