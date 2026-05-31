const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainJsPath = path.join(__dirname, '..', 'assets', 'js', 'main.js');
const source = fs.readFileSync(mainJsPath, 'utf8');

function createContext(hash, elementIds = []) {
    const listeners = {};
    const context = {
        console,
        location: { hash },
        document: {
            addEventListener(type, handler) {
                listeners[type] = handler;
            },
            getElementById(id) {
                return elementIds.includes(id) ? { id } : null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
        },
        window: {
            scrollTo() {},
            indexedDB: null,
            addEventListener() {},
            setTimeout,
        },
        localStorage: {
            getItem() {
                return null;
            },
            removeItem() {},
        },
        requestAnimationFrame(callback) {
            callback();
        },
        IntersectionObserver: function IntersectionObserver() {
            return {
                observe() {},
                unobserve() {},
            };
        },
    };
    context.window.location = context.location;
    context.window.document = context.document;
    context.window.localStorage = context.localStorage;
    context.window.requestAnimationFrame = context.requestAnimationFrame;
    context.window.IntersectionObserver = context.IntersectionObserver;
    context.__listeners = listeners;
    return vm.createContext(context);
}

function loadMainScript(context) {
    vm.runInContext(source, context, { filename: mainJsPath });
    assert.strictEqual(typeof context.__listeners.DOMContentLoaded, 'function');
}

const validAnchorContext = createContext('#work', ['work']);
loadMainScript(validAnchorContext);
assert.strictEqual(validAnchorContext.hasInPageAnchorTarget(), true);

const malformedHashContext = createContext('#%E0%A4%A', ['work']);
loadMainScript(malformedHashContext);
assert.doesNotThrow(() => malformedHashContext.hasInPageAnchorTarget());
assert.strictEqual(malformedHashContext.hasInPageAnchorTarget(), false);
