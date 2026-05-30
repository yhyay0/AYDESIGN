const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainScript = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');

function loadMainWithHash(hash, existingIds = []) {
    const ids = new Set(existingIds);
    const sandbox = {
        console,
        location: { hash },
        window: {
            scrollTo() {},
            addEventListener() {},
            setTimeout() {},
            requestAnimationFrame(callback) {
                callback();
            }
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
        fetch() {
            return Promise.reject(new Error('fetch not available in test'));
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
    sandbox.window.document = sandbox.document;
    sandbox.window.location = sandbox.location;
    sandbox.window.localStorage = sandbox.localStorage;
    sandbox.window.indexedDB = null;

    vm.createContext(sandbox);
    vm.runInContext(mainScript, sandbox, { filename: 'assets/js/main.js' });
    return sandbox;
}

{
    const sandbox = loadMainWithHash('#work', ['work']);
    assert.strictEqual(sandbox.hasInPageAnchorTarget(), true);
}

{
    const sandbox = loadMainWithHash('#missing', ['work']);
    assert.strictEqual(sandbox.hasInPageAnchorTarget(), false);
}

{
    const sandbox = loadMainWithHash('#%E0%A4%A', ['work']);
    assert.doesNotThrow(() => sandbox.hasInPageAnchorTarget());
    assert.strictEqual(sandbox.hasInPageAnchorTarget(), false);
}

{
    const sandbox = loadMainWithHash('#');
    assert.strictEqual(sandbox.hasInPageAnchorTarget(), false);
}

console.log('scroll hash tests passed');
