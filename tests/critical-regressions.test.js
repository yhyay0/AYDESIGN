const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadBrowserScript(relativePath, contextOverrides = {}) {
    const listeners = {};
    const context = {
        console,
        location: { hash: '' },
        window: {
            scrollTo() {},
            setTimeout,
            indexedDB: null
        },
        document: {
            addEventListener(type, handler) {
                listeners[type] = handler;
            },
            getElementById() {
                return null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            createElement() {
                return {};
            },
            body: { style: {} }
        },
        localStorage: {
            getItem() { return null; },
            setItem() {},
            removeItem() {}
        },
        requestAnimationFrame(callback) {
            callback();
        },
        setTimeout,
        clearTimeout,
        alert() {},
        confirm() { return true; },
        fetch: async () => ({ ok: true, json: async () => ({ profile: {}, projects: [] }) }),
        IntersectionObserver: class {
            observe() {}
            unobserve() {}
        },
        ...contextOverrides
    };
    context.window.document = context.document;
    context.window.localStorage = context.localStorage;
    context.window.requestAnimationFrame = context.requestAnimationFrame;
    context.window.location = context.location;

    vm.createContext(context);
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
    return { context, listeners };
}

function testMalformedHashDoesNotThrow() {
    const { context } = loadBrowserScript('assets/js/main.js');
    context.location.hash = '#%';

    assert.doesNotThrow(() => {
        assert.strictEqual(context.getInPageAnchorTarget(), null);
    });
}

async function testColdLoadHashScrollsToAnchor() {
    const rafCallbacks = [];
    const target = {
        scrolled: false,
        scrollIntoView() {
            this.scrolled = true;
        }
    };
    const scrollCalls = [];
    const { context, listeners } = loadBrowserScript('assets/js/main.js', {
        location: { hash: '#work' },
        window: {
            scrollTo(x, y) {
                scrollCalls.push([x, y]);
            },
            setTimeout,
            indexedDB: null
        },
        document: {
            addEventListener(type, handler) {
                listeners[type] = handler;
            },
            getElementById(id) {
                return id === 'work' ? target : null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            createElement() {
                return {};
            },
            body: { style: {} }
        },
        requestAnimationFrame(callback) {
            rafCallbacks.push(callback);
        }
    });

    vm.runInContext('initApp = async () => {};', context);
    listeners.DOMContentLoaded();
    await Promise.resolve();
    await Promise.resolve();
    while (rafCallbacks.length > 0) {
        rafCallbacks.shift()();
    }

    assert.strictEqual(target.scrolled, true);
    assert.deepStrictEqual(scrollCalls, []);
}

async function testProjectImageUploadFollowsOriginalProjectAfterReorder() {
    const { context } = loadBrowserScript('assets/js/admin.js', {
        document: {
            addEventListener() {},
            getElementById(id) {
                if (id === 'projects-list' || id === 'json-preview') {
                    return { value: '', innerHTML: '' };
                }
                return null;
            },
            querySelectorAll() {
                return [];
            },
            querySelector() {
                return null;
            },
            body: { style: {} }
        }
    });

    const projects = await vm.runInContext(`
        (async () => {
            portfolioData = {
                projects: [
                    { id: 1, title: 'A', category: '', year: '', image: 'old-a', description: '', tools: [], additionalInfo: [], gallery: ['old-gallery-a'] },
                    { id: 2, title: 'B', category: '', year: '', image: 'old-b', description: '', tools: [], additionalInfo: [], gallery: ['old-gallery-b'] }
                ]
            };
            let resolveUpload;
            readAndCompressImage = () => new Promise((resolve) => { resolveUpload = resolve; });
            const upload = uploadProjectImage(0, {});
            moveProject(0, 1);
            resolveUpload('new-image-a');
            await upload;
            return portfolioData.projects.map((project) => ({
                id: project.id,
                image: project.image,
                gallery: project.gallery
            }));
        })();
    `, context);

    assert.deepStrictEqual(projects, [
        { id: 2, image: 'old-b', gallery: ['old-gallery-b'] },
        { id: 1, image: 'new-image-a', gallery: ['old-gallery-a'] }
    ]);
}

async function testGalleryUploadFollowsOriginalProjectAfterReorder() {
    const { context } = loadBrowserScript('assets/js/admin.js', {
        document: {
            addEventListener() {},
            getElementById(id) {
                if (id === 'projects-list' || id === 'json-preview') {
                    return { value: '', innerHTML: '' };
                }
                return null;
            },
            querySelectorAll() {
                return [];
            },
            querySelector() {
                return null;
            },
            body: { style: {} }
        }
    });

    const projects = await vm.runInContext(`
        (async () => {
            portfolioData = {
                projects: [
                    { id: 1, title: 'A', category: '', year: '', image: 'old-a', description: '', tools: [], additionalInfo: [], gallery: ['old-gallery-a'] },
                    { id: 2, title: 'B', category: '', year: '', image: 'old-b', description: '', tools: [], additionalInfo: [], gallery: ['old-gallery-b'] }
                ]
            };
            let resolveUpload;
            readAndCompressImage = () => new Promise((resolve) => { resolveUpload = resolve; });
            const upload = uploadProjectGalleryImage(0, 0, {});
            moveProject(0, 1);
            resolveUpload('new-gallery-a');
            await upload;
            return portfolioData.projects.map((project) => ({
                id: project.id,
                image: project.image,
                gallery: project.gallery
            }));
        })();
    `, context);

    assert.deepStrictEqual(projects, [
        { id: 2, image: 'old-b', gallery: ['old-gallery-b'] },
        { id: 1, image: 'old-a', gallery: ['new-gallery-a'] }
    ]);
}

(async () => {
    testMalformedHashDoesNotThrow();
    await testColdLoadHashScrollsToAnchor();
    await testProjectImageUploadFollowsOriginalProjectAfterReorder();
    await testGalleryUploadFollowsOriginalProjectAfterReorder();
    console.log('critical regression tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
