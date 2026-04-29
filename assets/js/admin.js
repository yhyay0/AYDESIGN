// Global data storage
let portfolioData = {};
const STORAGE_KEY = 'portfolioData';
const STORAGE_DB_NAME = 'AYDesignStorage';
const STORAGE_DB_VERSION = 1;
const STORAGE_STORE_NAME = 'keyValue';
const REPO_CDN_BASE = 'https://cdn.jsdelivr.net/gh/yhyay0/AYDESIGN@main/';
let storageDbPromise = null;

function getStorageDb() {
    if (storageDbPromise) return storageDbPromise;
    storageDbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = window.indexedDB.open(STORAGE_DB_NAME, STORAGE_DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORAGE_STORE_NAME)) {
                db.createObjectStore(STORAGE_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });
    return storageDbPromise;
}

async function getStoredData() {
    try {
        const db = await getStorageDb();
        const data = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORAGE_STORE_NAME, 'readonly');
            const store = tx.objectStore(STORAGE_STORE_NAME);
            const req = store.get(STORAGE_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
        });
        if (data) return data;
    } catch (error) {
        console.warn('IndexedDB read failed, trying localStorage.', error);
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) return null;
    try {
        const parsed = JSON.parse(localData);
        await saveStoredData(parsed);
        localStorage.removeItem(STORAGE_KEY);
        return parsed;
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

async function saveStoredData(value) {
    try {
        const db = await getStorageDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORAGE_STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORAGE_STORE_NAME);
            const req = store.put(value, STORAGE_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error || new Error('IndexedDB write failed'));
        });
    } catch (error) {
        console.warn('IndexedDB write failed, using localStorage fallback.', error);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
}

async function clearStoredData() {
    try {
        const db = await getStorageDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORAGE_STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORAGE_STORE_NAME);
            const req = store.delete(STORAGE_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error || new Error('IndexedDB delete failed'));
        });
    } catch (error) {
        console.warn('IndexedDB clear failed.', error);
    }
    localStorage.removeItem(STORAGE_KEY);
}
function normalizeImageReference(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/assets/')) return `${REPO_CDN_BASE}${trimmed.slice(1)}`;
    if (trimmed.startsWith('assets/')) return `${REPO_CDN_BASE}${trimmed}`;
    return trimmed;
}
function resolveMediaValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return normalizeImageReference(value);
    if (typeof value === 'object') {
        const upload = typeof value.upload === 'string' ? value.upload.trim() : '';
        const url = typeof value.url === 'string' ? value.url.trim() : '';
        return normalizeImageReference(upload || url || '');
    }
    return '';
}

function normalizePortfolioDataShape() {
    portfolioData.profile = portfolioData.profile && typeof portfolioData.profile === 'object' ? portfolioData.profile : {};
    portfolioData.profile.contact = portfolioData.profile.contact && typeof portfolioData.profile.contact === 'object'
        ? portfolioData.profile.contact
        : {};
    portfolioData.profile.skills = Array.isArray(portfolioData.profile.skills) ? portfolioData.profile.skills : [];
    portfolioData.projects = Array.isArray(portfolioData.projects) ? portfolioData.projects : [];

    portfolioData.projects = portfolioData.projects.map((project, index) => {
        const nextProject = project && typeof project === 'object' ? { ...project } : {};
        nextProject.id = typeof nextProject.id === 'number' ? nextProject.id : index + 1;
        nextProject.title = typeof nextProject.title === 'string' ? nextProject.title : 'Untitled Project';
        nextProject.category = typeof nextProject.category === 'string' ? nextProject.category : '';
        nextProject.description = typeof nextProject.description === 'string' ? nextProject.description : '';
        nextProject.year = nextProject.year || '';
        nextProject.tools = Array.isArray(nextProject.tools) ? nextProject.tools : [];
        nextProject.additionalInfo = Array.isArray(nextProject.additionalInfo) ? nextProject.additionalInfo : [];
        nextProject.image = resolveMediaValue(nextProject.image);
        nextProject.gallery = Array.isArray(nextProject.gallery)
            ? nextProject.gallery.map(resolveMediaValue).filter(Boolean)
            : [];
        return nextProject;
    });
}
function getDefaultPortfolioData() {
    return {
        profile: {
            role: 'Visual Communication & UI/UX Designer',
            subtitle: 'Creating meaningful digital and physical experiences through minimalist aesthetics and user-centered design.',
            bio: 'I am Anthony Yau, a designer focused on branding, UI/UX, and visual storytelling.\n\nI help businesses translate ideas into clear, elegant experiences across web, mobile, and marketing touchpoints.',
            termsOfUse: 'By accessing this portfolio, you agree to use all content for viewing and evaluation purposes only.\n\nAll designs, visuals, and written materials are the intellectual property of Anthony Yau unless otherwise stated.\n\nYou may not copy, reproduce, republish, or redistribute any part of this portfolio without prior written permission.\n\nProject outcomes and case details are presented for demonstration and may include confidential elements modified for public display.\n\nFor collaborations, licensing, or media use, please contact hello@anthonyyau.design.',
            skills: ['UI/UX Design', 'Brand Identity', 'Visual Design', 'Design Systems', 'Wireframing', 'Prototyping'],
            contact: {
                email: 'hello@anthonyyau.design',
                linkedin: 'www.linkedin.com/in/anthonyyau',
                instagram: 'www.instagram.com/anthonyyau.design',
                behance: 'www.behance.net/anthonyyau'
            }
        },
        projects: [
            {
                id: 1,
                title: 'Luna Coffee Rebrand',
                category: 'Branding Design',
                image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80',
                description: 'A full brand refresh for a boutique coffee chain focused on modern packaging, tone of voice, and in-store visual language.',
                tools: ['Illustrator', 'Photoshop', 'Figma'],
                additionalInfo: [
                    'Developed a modular logo and icon suite for cups, signage, and social assets.',
                    'Created a visual system balancing premium aesthetics with everyday approachability.'
                ],
                gallery: [
                    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=80',
                    'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1400&q=80'
                ],
                year: 2024
            },
            {
                id: 2,
                title: 'FinFlow Mobile App',
                category: 'UI/UX Design',
                image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80',
                description: 'Designed an end-to-end personal finance mobile experience with clear information hierarchy and goal-based onboarding.',
                tools: ['Figma', 'FigJam', 'Principle'],
                additionalInfo: [
                    'Reduced onboarding drop-off by simplifying the first-time flow into three guided steps.',
                    'Built reusable card, chart, and form patterns to speed product team delivery.'
                ],
                gallery: [
                    'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1400&q=80',
                    'https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&w=1400&q=80'
                ],
                year: 2025
            },
            {
                id: 3,
                title: 'Aether Studio Website',
                category: 'Web Experience',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
                description: 'A responsive portfolio website for a creative studio, emphasizing motion, readability, and project-first storytelling.',
                tools: ['Figma', 'Webflow', 'After Effects'],
                additionalInfo: [
                    'Defined page rhythm and transitions to keep focus on featured projects.',
                    'Optimized layout and media strategy for faster loading on mobile devices.'
                ],
                gallery: [
                    'https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&w=1400&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80'
                ],
                year: 2026
            }
        ]
    };
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData();
});

// Load portfolio data from JSON
async function loadPortfolioData() {
    try {
        const storedData = await getStoredData();
        let loadedFromLocal = false;
        if (storedData) {
            portfolioData = storedData;
            loadedFromLocal = true;
        }

        if (!loadedFromLocal) {
            try {
                const response = await fetch('data/portfolio.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch data/portfolio.json (status ${response.status})`);
                }
                portfolioData = await response.json();
            } catch (fetchError) {
                console.warn('Fetch failed, falling back to default data (likely file:// access).', fetchError);
                portfolioData = getDefaultPortfolioData();
            }
            persistPortfolioData();
        }

        normalizePortfolioDataShape();
        populateProfileForm();
        renderProjects();
        updateJSONPreview();
    } catch (error) {
        console.error('Error loading portfolio data:', error);
        alert(`Failed to load portfolio data: ${error.message}`);
    }
}

// Populate profile form with current data
function populateProfileForm() {
    document.getElementById('profile-role').value = portfolioData.profile.role || '';
    document.getElementById('profile-subtitle').value = portfolioData.profile.subtitle || '';
    document.getElementById('profile-bio').value = portfolioData.profile.bio || '';
    document.getElementById('profile-terms').value = portfolioData.profile.termsOfUse || '';
    document.getElementById('profile-skills').value = (portfolioData.profile.skills || []).join(', ');
    document.getElementById('profile-email').value = portfolioData.profile.contact?.email || '';
    document.getElementById('profile-linkedin').value = portfolioData.profile.contact?.linkedin || '';
    document.getElementById('profile-instagram').value = portfolioData.profile.contact?.instagram || '';
    document.getElementById('profile-behance').value = portfolioData.profile.contact?.behance || '';
}

// Save profile changes
function saveProfile() {
    portfolioData.profile.role = document.getElementById('profile-role').value;
    portfolioData.profile.subtitle = document.getElementById('profile-subtitle').value;
    portfolioData.profile.bio = document.getElementById('profile-bio').value;
    portfolioData.profile.termsOfUse = document.getElementById('profile-terms').value;
    portfolioData.profile.skills = document.getElementById('profile-skills').value.split(',').map(s => s.trim());
    portfolioData.profile.contact = {
        email: document.getElementById('profile-email').value,
        linkedin: document.getElementById('profile-linkedin').value,
        instagram: document.getElementById('profile-instagram').value,
        behance: document.getElementById('profile-behance').value
    };

    updateJSONPreview();
    alert('Profile saved locally. Refresh index.html to see updates.');
}

// Render projects list
function renderProjects() {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList || !portfolioData.projects) return;

    projectsList.innerHTML = portfolioData.projects.map((project, index) => `
        <div class="bg-white rounded-lg p-8 border border-gray-200">
            <div class="flex justify-between items-start mb-6">
                <h3 class="text-xl font-bold">${project.title}</h3>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="moveProject(${index}, -1)" class="text-xs px-3 py-1 border border-gray-300 rounded hover:border-black transition" ${index === 0 ? 'disabled' : ''}>Move Up</button>
                    <button type="button" onclick="moveProject(${index}, 1)" class="text-xs px-3 py-1 border border-gray-300 rounded hover:border-black transition" ${index === portfolioData.projects.length - 1 ? 'disabled' : ''}>Move Down</button>
                    <button onclick="deleteProject(${index})" class="text-red-600 hover:text-red-800 font-semibold text-sm">Delete</button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-semibold mb-2">Title</label>
                    <input type="text" value="${project.title}" onchange="updateProject(${index}, 'title', this.value)" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Category</label>
                    <input type="text" value="${project.category}" onchange="updateProject(${index}, 'category', this.value)" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-semibold mb-2">Year</label>
                    <input type="number" value="${project.year}" onchange="updateProject(${index}, 'year', this.value)" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Image URL</label>
                    <input type="text" value="${project.image}" onchange="updateProject(${index}, 'image', this.value)" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">
                    <label class="block text-xs text-gray-500 mt-2 mb-1">Or upload local image</label>
                    <input type="file" accept="image/*" onchange="uploadProjectImage(${index}, this.files[0])" class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                    ${project.image ? `
                        <div class="mt-3">
                            <p class="text-xs text-gray-500 mb-1">Preview</p>
                            <img src="${project.image}" alt="${project.title}" class="w-24 h-24 object-cover border border-gray-200 rounded">
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="mb-6">
                <label class="block text-sm font-semibold mb-2">Description</label>
                <textarea onchange="updateProject(${index}, 'description', this.value)" rows="4" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">${project.description}</textarea>
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2">Hashtag(s) (comma-separated)</label>
                <input type="text" value="${project.tools.join(', ')}" onchange="updateProject(${index}, 'tools', this.value.split(',').map(t => t.trim()))" class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black">
            </div>
            <div class="mt-6">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-semibold">Additional Information</label>
                    <button type="button" onclick="addProjectListItem(${index}, 'additionalInfo')" class="text-xs font-semibold px-3 py-1 border border-gray-300 rounded hover:border-black transition">Add Info</button>
                </div>
                <div class="space-y-2">
                    ${(project.additionalInfo || []).map((item, itemIndex) => `
                        <div class="flex flex-col md:flex-row gap-2">
                            <input type="text" value="${item}" onchange="updateProjectListItem(${index}, 'additionalInfo', ${itemIndex}, this.value)" class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black">
                            <button type="button" onclick="removeProjectListItem(${index}, 'additionalInfo', ${itemIndex})" class="shrink-0 text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-2 border border-red-200 rounded md:border-0 md:rounded-none md:px-2 md:py-0">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="mt-6">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-semibold">Additional Images</label>
                    <button type="button" onclick="addProjectListItem(${index}, 'gallery')" class="text-xs font-semibold px-3 py-1 border border-gray-300 rounded hover:border-black transition">Add Image</button>
                </div>
                <div class="space-y-2">
                    ${(project.gallery || []).map((img, imgIndex) => `
                        <div class="flex flex-col md:flex-row gap-2">
                            <input type="text" value="${img}" onchange="updateProjectListItem(${index}, 'gallery', ${imgIndex}, this.value)" class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black" placeholder="assets/img/projects/another-image.png">
                            <input type="file" accept="image/*" onchange="uploadProjectGalleryImage(${index}, ${imgIndex}, this.files[0])" class="w-full md:w-48 border border-gray-300 rounded px-2 py-2 text-xs">
                            ${img ? `<img src="${img}" alt="Gallery preview" class="w-16 h-16 object-cover border border-gray-200 rounded">` : '<div class="w-16 h-16 border border-dashed border-gray-200 rounded"></div>'}
                            <div class="flex gap-1">
                                <button type="button" onclick="moveProjectListItem(${index}, 'gallery', ${imgIndex}, -1)" class="shrink-0 text-xs px-2 py-2 border border-gray-300 rounded hover:border-black transition" ${imgIndex === 0 ? 'disabled' : ''}>↑</button>
                                <button type="button" onclick="moveProjectListItem(${index}, 'gallery', ${imgIndex}, 1)" class="shrink-0 text-xs px-2 py-2 border border-gray-300 rounded hover:border-black transition" ${imgIndex === (project.gallery || []).length - 1 ? 'disabled' : ''}>↓</button>
                            </div>
                            <button type="button" onclick="removeProjectListItem(${index}, 'gallery', ${imgIndex})" class="shrink-0 text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-2 border border-red-200 rounded md:border-0 md:rounded-none md:px-2 md:py-0">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Update project data
function updateProject(index, field, value) {
    if (field === 'image' && typeof value === 'string') {
        value = normalizeImageReference(value);
    }
    portfolioData.projects[index][field] = value;
    updateJSONPreview();
}

function addProjectListItem(index, field) {
    if (!Array.isArray(portfolioData.projects[index][field])) {
        portfolioData.projects[index][field] = [];
    }
    portfolioData.projects[index][field].push('');
    renderProjects();
    updateJSONPreview();
}

function updateProjectListItem(index, field, itemIndex, value) {
    if (!Array.isArray(portfolioData.projects[index][field])) {
        portfolioData.projects[index][field] = [];
    }
    if (field === 'gallery' && typeof value === 'string') {
        value = normalizeImageReference(value);
    }
    portfolioData.projects[index][field][itemIndex] = value;
    updateJSONPreview();
}

function removeProjectListItem(index, field, itemIndex) {
    if (!Array.isArray(portfolioData.projects[index][field])) return;
    portfolioData.projects[index][field].splice(itemIndex, 1);
    renderProjects();
    updateJSONPreview();
}

function moveProjectListItem(index, field, itemIndex, direction) {
    if (!Array.isArray(portfolioData.projects[index][field])) return;
    const list = portfolioData.projects[index][field];
    const targetIndex = itemIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[itemIndex], list[targetIndex]] = [list[targetIndex], list[itemIndex]];
    renderProjects();
    updateJSONPreview();
}

// Delete project
function deleteProject(index) {
    if (confirm('Are you sure you want to delete this project?')) {
        portfolioData.projects.splice(index, 1);
        renderProjects();
        updateJSONPreview();
    }
}

function moveProject(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= portfolioData.projects.length) return;
    [portfolioData.projects[index], portfolioData.projects[targetIndex]] = [portfolioData.projects[targetIndex], portfolioData.projects[index]];
    renderProjects();
    updateJSONPreview();
}

// Add new project
function addProject() {
    const newProject = {
        id: Math.max(...portfolioData.projects.map(p => p.id), 0) + 1,
        title: document.getElementById('new-title').value,
        category: document.getElementById('new-category').value,
        image: document.getElementById('new-image').value,
        description: document.getElementById('new-description').value,
        tools: document.getElementById('new-tools').value.split(',').map(t => t.trim()),
        additionalInfo: [],
        gallery: [],
        year: document.getElementById('new-year').value
    };

    if (!newProject.title || !newProject.category) {
        alert('Please fill in title and category');
        return;
    }
    newProject.image = normalizeImageReference(newProject.image);

    portfolioData.projects.push(newProject);
    document.getElementById('new-project-form').reset();
    renderProjects();
    updateJSONPreview();
    alert('Project added successfully!');
}

const IMAGE_MAX_DIMENSION = 960;
const IMAGE_OUTPUT_QUALITY = 0.68;

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }
        if (!file.type.startsWith('image/')) {
            reject(new Error('Only image files are allowed'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

function compressImageDataUrl(sourceDataUrl, outputMime = 'image/jpeg', quality = IMAGE_OUTPUT_QUALITY) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const { width, height } = img;
            const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height));
            const targetW = Math.max(1, Math.round(width * scale));
            const targetH = Math.max(1, Math.round(height * scale));

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to initialize image canvas'));
                return;
            }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const compressed = canvas.toDataURL(outputMime, quality);
            resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to decode image file'));
        img.src = sourceDataUrl;
    });
}

async function readAndCompressImage(file) {
    const originalDataUrl = await readFileAsDataUrl(file);
    // Prefer WebP for faster loading and smaller footprint.
    return compressImageDataUrl(originalDataUrl, 'image/webp', IMAGE_OUTPUT_QUALITY);
}

async function uploadNewProjectImage(file) {
    try {
        const dataUrl = await readAndCompressImage(file);
        document.getElementById('new-image').value = dataUrl;
    } catch (error) {
        alert(error.message);
    }
}

async function uploadProjectImage(index, file) {
    try {
        const dataUrl = await readAndCompressImage(file);
        portfolioData.projects[index].image = dataUrl;
        renderProjects();
        updateJSONPreview();
    } catch (error) {
        alert(error.message);
    }
}

async function uploadProjectGalleryImage(index, itemIndex, file) {
    try {
        const dataUrl = await readAndCompressImage(file);
        if (!Array.isArray(portfolioData.projects[index].gallery)) {
            portfolioData.projects[index].gallery = [];
        }
        portfolioData.projects[index].gallery[itemIndex] = dataUrl;
        renderProjects();
        updateJSONPreview();
    } catch (error) {
        alert(error.message);
    }
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('hidden'));
    document.querySelectorAll('[data-tab-button]').forEach((btn) => {
        btn.classList.remove('border-black', 'text-black');
        btn.classList.add('border-transparent', 'text-gray-600');
    });

    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeButton = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }
    if (activeButton) {
        activeButton.classList.remove('border-transparent', 'text-gray-600');
        activeButton.classList.add('border-black', 'text-black');
    }
}

// Update JSON preview
function updateJSONPreview() {
    const preview = document.getElementById('json-preview');
    if (preview) {
        preview.value = JSON.stringify(portfolioData, null, 2);
    }
    persistPortfolioData();
}

function persistPortfolioData() {
    saveStoredData(portfolioData);
}

async function clearLocalData() {
    const shouldClear = confirm('Clear local autosaved data and reload from file/default data?');
    if (!shouldClear) return;
    await clearStoredData();
    await loadPortfolioData();
    alert('Local autosaved data cleared.');
}

// Export JSON
function exportJSON() {
    const dataStr = JSON.stringify(portfolioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Import JSON
function importJSON() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a JSON file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            portfolioData = JSON.parse(e.target.result);
            populateProfileForm();
            renderProjects();
            updateJSONPreview();
            alert('JSON imported successfully!');
            fileInput.value = '';
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Copy JSON to clipboard
function copyJSON() {
    const jsonText = document.getElementById('json-preview').value;
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('JSON copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy JSON');
    });
}
