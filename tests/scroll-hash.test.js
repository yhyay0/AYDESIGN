const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const mainScript = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadMainWithHash(hash, existingIds = []) {
    const context = {
        console,
        Date,
        location: { hash },
        window: {
            scrollTo() {},
            addEventListener() {},
            setTimeout() {},
            indexedDB: null
        },
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
            body: { style: {} }
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
        },
        fetch: async () => ({
            ok: false,
            status: 404,
            json: async () => ({})
        }),
        alert() {}
    };

    vm.createContext(context);
    vm.runInContext(mainScript, context, { filename: 'assets/js/main.js' });
    return context;
}

assert.equal(loadMainWithHash('#portfolio').hasInPageAnchorTarget(), false);
assert.equal(loadMainWithHash('#portfolio', ['portfolio']).hasInPageAnchorTarget(), true);
assert.equal(loadMainWithHash('#portfolio%2Dgrid', ['portfolio-grid']).hasInPageAnchorTarget(), true);

assert.doesNotThrow(() => {
    assert.equal(loadMainWithHash('#%E0%A4%A', ['portfolio']).hasInPageAnchorTarget(), false);
});
assert.doesNotThrow(() => {
    assert.equal(loadMainWithHash('#%').hasInPageAnchorTarget(), false);
});

console.log('scroll hash tests passed');
