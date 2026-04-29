document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const STORAGE_KEY = 'portfolioData';
const isLocalPreview = () => {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
};

function resolveMediaValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
        const upload = typeof value.upload === 'string' ? value.upload.trim() : '';
        const url = typeof value.url === 'string' ? value.url.trim() : '';
        return upload || url || '';
    }
    return '';
}

function normalizeMediaSrc(raw = '') {
    const src = String(raw).trim();
    if (!src) return '';
    if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
        return src;
    }
    // Normalize local paths from CMS uploads: assets/..., /assets/..., ./assets/...
    const noDotSlash = src.replace(/^\.\//, '');
    const noLeadingSlash = noDotSlash.replace(/^\/+/, '');
    return `/${encodeURI(noLeadingSlash)}`;
}

function inferMediaKind(src = '') {
    const clean = src.toLowerCase().split('?')[0].split('#')[0];
    if (/\.(mp4|webm|ogg|mov|m4v)$/.test(clean)) return 'video';
    return 'image';
}

function resolveMediaItem(value) {
    if (!value) return null;
    if (typeof value === 'string') {
        const src = normalizeMediaSrc(value);
        if (!src) return null;
        return { src, kind: inferMediaKind(src) };
    }
    if (typeof value === 'object') {
        const upload = typeof value.upload === 'string' ? value.upload.trim() : '';
        const url = typeof value.url === 'string' ? value.url.trim() : '';
        const src = normalizeMediaSrc(upload || url);
        if (!src) return null;
        const kind = value.kind === 'video' || value.kind === 'image' ? value.kind : inferMediaKind(src);
        return { src, kind };
    }
    return null;
}

function resolveProjectPreviewImage(project) {
    if (!project) return '';
    const coverItem = resolveMediaItem(project.image);
    if (coverItem && coverItem.kind === 'image') return coverItem.src;
    const gallery = Array.isArray(project.gallery) ? project.gallery : [];
    for (const item of gallery) {
        const resolved = resolveMediaItem(item);
        if (resolved && resolved.kind === 'image') return resolved.src;
    }
    return '';
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

async function initApp() {
    try {
        const data = await loadPortfolioData();
        renderProfile(data.profile);
        initMobileMenu();
        initTermsPage();
        initContactForm();
        renderProjects(data.projects);
        currentProjects = Array.isArray(data.projects) ? data.projects : [];
        initHeroProjectScrubber(data.projects);
        initScrollAnimations();
        initFadeVisibilityAnimations();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function loadPortfolioData() {
    // In production, always read from repository JSON so all deployed sites stay consistent.
    if (isLocalPreview()) {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
            try {
                return JSON.parse(localData);
            } catch (parseError) {
                console.warn('Invalid local portfolio data. Falling back to data/portfolio.json.', parseError);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }
    try {
        const [profileResponse, projectsResponse] = await Promise.all([
            fetch(`data/cms/profile.json?t=${Date.now()}`),
            fetch(`data/cms/projects.json?t=${Date.now()}`)
        ]);
        if (profileResponse.ok && projectsResponse.ok) {
            const profile = await profileResponse.json();
            const projectsPayload = await projectsResponse.json();
            return {
                profile,
                projects: Array.isArray(projectsPayload.items) ? projectsPayload.items : []
            };
        }
    } catch (cmsFetchError) {
        console.warn('Split CMS files not available, fallback to portfolio.json.', cmsFetchError);
    }
    try {
        const response = await fetch(`data/portfolio.json?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data/portfolio.json (status ${response.status})`);
        }
        return response.json();
    } catch (fetchError) {
        console.warn('Fetch failed, falling back to default data (likely file:// access).', fetchError);
        return getDefaultPortfolioData();
    }
}

function renderProfile(profile) {
    const normalizeExternalUrl = (value) => {
        if (!value) return '#';
        const trimmed = value.trim();
        if (!trimmed) return '#';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
    };

    const heroText = document.querySelector('h1');
    if (heroText && profile.role) {
        heroText.innerHTML = `${profile.role}.`;
    }

    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent = profile.subtitle || '';
    }

    const termsContent = document.getElementById('terms-content');
    if (termsContent) {
        termsContent.textContent = profile.termsOfUse || 'Terms of use content is not set yet.';
    }

    document.getElementById('about-bio').textContent = profile.bio;
    
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = profile.skills.map(skill => 
        `<span class="px-3 py-1 border border-black/10 text-[10px] font-bold tracking-widest uppercase text-gray-600">${skill}</span>`
    ).join('');

    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink && profile.contact?.email) {
        emailLink.href = `mailto:${profile.contact.email}`;
        emailLink.textContent = profile.contact.email;
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.dataset.toEmail = profile.contact?.email || '';
    }

    const instagramLink = document.getElementById('contact-instagram-link');
    if (instagramLink) {
        instagramLink.href = normalizeExternalUrl(profile.contact?.instagram);
    }

    const linkedinLink = document.getElementById('contact-linkedin-link');
    if (linkedinLink) {
        linkedinLink.href = normalizeExternalUrl(profile.contact?.linkedin);
    }

    const behanceLink = document.getElementById('contact-behance-link');
    if (behanceLink) {
        behanceLink.href = normalizeExternalUrl(profile.contact?.behance);
    }
}

function initTermsPage() {
    const toggleButton = document.getElementById('terms-toggle-button');
    const mobileToggleButton = document.getElementById('mobile-terms-toggle-button');
    const closeButton = document.getElementById('terms-page-close');
    const page = document.getElementById('terms-page');
    const card = document.getElementById('terms-page-card');
    if ((!toggleButton && !mobileToggleButton) || !closeButton || !page || !card || page.dataset.bound === 'true') return;
    page.dataset.bound = 'true';

    const openPage = () => {
        if (!page.classList.contains('hidden')) return;
        page.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            page.classList.remove('opacity-0');
            card.classList.remove('translate-y-3');
        });
    };
    const closePage = () => {
        if (page.classList.contains('hidden')) return;
        page.classList.add('opacity-0');
        card.classList.add('translate-y-3');
        window.setTimeout(() => {
            page.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    };

    if (toggleButton) {
        toggleButton.addEventListener('click', openPage);
    }
    if (mobileToggleButton) {
        mobileToggleButton.addEventListener('click', openPage);
    }
    closeButton.addEventListener('click', closePage);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePage();
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const panel = document.getElementById('mobile-menu-panel');
    if (!toggle || !panel || toggle.dataset.bound === 'true') return;
    toggle.dataset.bound = 'true';

    const setOpenState = (isOpen) => {
        panel.classList.toggle('is-open', isOpen);
        toggle.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    toggle.addEventListener('click', () => {
        const isOpen = !panel.classList.contains('is-open');
        setOpenState(isOpen);
    });

    panel.querySelectorAll('.mobile-menu-link').forEach((item) => {
        item.addEventListener('click', () => setOpenState(false));
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            setOpenState(false);
        }
    });

    document.addEventListener('click', (event) => {
        if (!panel.classList.contains('is-open')) return;
        const clickedInsideMenu = panel.contains(event.target) || toggle.contains(event.target);
        if (!clickedInsideMenu) {
            setOpenState(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpenState(false);
        }
    });
}

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm || contactForm.dataset.bound === 'true') return;
    contactForm.dataset.bound = 'true';

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const toEmail = (contactForm.dataset.toEmail || '').trim();
        if (!toEmail) {
            alert('Recipient email is not set in admin profile.');
            return;
        }

        const nameInput = document.getElementById('contact-name-input');
        const emailInput = document.getElementById('contact-email-input');
        const messageInput = document.getElementById('contact-message-input');

        const senderName = nameInput ? nameInput.value.trim() : '';
        const senderEmail = emailInput ? emailInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!senderEmail || !message) {
            alert('Please fill in both Email and Message.');
            return;
        }

        const subject = `Partnership Inquiry: ${senderName || 'Anonymous'}`;
        const body = [
            'Hi Anthony,',
            '',
            message,
            '',
            'Best regards,',
            senderName || 'Anonymous',
            '',
            '',
            `Contact: ${senderEmail}`
        ].join('\n');

        const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    });
}

function renderProjects(projects) {
    const grid = document.getElementById('portfolio-grid');
    grid.innerHTML = projects.map((project, index) => {
        const gridClass = 'md:col-span-1';
        const coverMedia = resolveMediaItem(project.image);
        const projectImage = coverMedia && coverMedia.kind === 'image' ? coverMedia.src : '';
        
        return `
            <div class="project-card group ${gridClass} animate-slide-up" style="animation-delay: ${index * 0.1}s" onclick="openModal(${project.id})">
                <div class="relative overflow-hidden aspect-[16/10]">
                    ${projectImage
                        ? `<img src="${projectImage}" alt="${project.title}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full bg-gray-100 flex items-center justify-center text-center px-6">
                            <div>
                                <p class="text-[10px] font-bold tracking-widest uppercase mb-3 text-gray-400">${project.category}</p>
                                <h3 class="text-xl font-bold font-display text-black">${project.title}</h3>
                            </div>
                        </div>`
                    }
                    <div class="project-overlay">
                        <p class="text-[10px] font-bold tracking-widest uppercase mb-2 text-gray-400">${project.category}</p>
                        <h3 class="text-2xl font-bold font-display text-black mb-4">${project.title}</h3>
                        <span class="text-[10px] font-bold tracking-widest border-b border-black pb-1">VIEW PROJECT</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

let currentProjects = [];
let currentModalProjectIndex = -1;

function initProjectImageMagnifier() {
    const wrappers = document.querySelectorAll('#project-modal .project-image-zoom-wrap');
    wrappers.forEach((wrapper) => {
        const image = wrapper.querySelector('.project-detail-image');
        if (!image || wrapper.dataset.magnifierBound === 'true') return;
        wrapper.dataset.magnifierBound = 'true';
        const ZOOM = 1.8;
        let isZoomed = false;

        const updateOrigin = (event) => {
            const rect = wrapper.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
            const localY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
            const xPercent = (localX / rect.width) * 100;
            const yPercent = (localY / rect.height) * 100;
            image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        };

        wrapper.addEventListener('click', (event) => {
            updateOrigin(event);
            isZoomed = !isZoomed;
            image.style.transition = 'transform 220ms ease';
            image.style.transform = isZoomed ? `scale(${ZOOM})` : 'scale(1)';
            wrapper.style.cursor = isZoomed ? 'zoom-out' : 'zoom-in';
        });

        wrapper.addEventListener('mousemove', (event) => {
            if (!isZoomed) return;
            updateOrigin(event);
        });
    });
}

async function openModal(projectId, options = {}) {
    if (currentProjects.length === 0) {
        const data = await loadPortfolioData();
        currentProjects = Array.isArray(data.projects) ? data.projects : [];
    }

    const project = currentProjects.find(p => p.id === projectId);
    if (!project) return;
    currentModalProjectIndex = currentProjects.findIndex((p) => p.id === projectId);

    const modal = document.getElementById('project-modal');
    const content = document.getElementById('modal-content');
    const animateIn = options.animateIn !== false;

    const additionalInfo = (project.additionalInfo || []).filter(item => item && item.trim());
    const projectMediaItems = [resolveMediaItem(project.image), ...((project.gallery || []).map(resolveMediaItem))]
        .filter(Boolean);

    content.innerHTML = `
        <div id="modal-content-inner" class="opacity-100 translate-y-0 transition-all duration-300">
            <div class="max-w-6xl mx-auto px-6 md:px-10 pt-8 md:pt-12 pb-12">
                <div class="flex items-center justify-end gap-4 mb-8 md:mb-12">
                    <button type="button" onclick="closeModal()" class="text-black hover:opacity-50 text-4xl font-light leading-none">&times;</button>
                </div>

                <div class="mb-8 md:mb-12">
                    <p class="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">${project.category} — ${project.year}</p>
                    <h2 class="text-4xl md:text-7xl font-bold font-display mb-6 md:mb-10 tracking-tighter leading-[0.92]">${project.title}</h2>
                    <p class="text-base md:text-xl text-gray-600 leading-relaxed max-w-4xl">${project.description}</p>
                </div>

                <div class="mb-10 md:mb-14">
                    <div class="flex flex-wrap gap-2 md:gap-3">
                        ${project.tools.map(tool => `<span class="px-3 py-1 bg-gray-100 text-[10px] font-bold tracking-widest uppercase text-gray-500">${tool}</span>`).join('')}
                    </div>
                    ${additionalInfo.length > 0 ? `
                        <ul class="mt-6 space-y-2 text-sm md:text-base text-gray-700 max-w-4xl">
                            ${additionalInfo.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>

                <div class="space-y-6 md:space-y-10">
                    ${projectMediaItems.length > 0
                        ? projectMediaItems.map((media) => `
                            <div class="project-image-zoom-wrap w-full bg-gray-50 border border-black/5">
                                ${media.kind === 'video'
                                    ? `<video src="${media.src}" autoplay muted loop playsinline class="project-detail-image w-full h-auto object-contain bg-black"></video>`
                                    : `<img src="${media.src}" alt="${project.title}" class="project-detail-image w-full h-auto object-contain">`
                                }
                            </div>
                        `).join('')
                        : `<div class="w-full bg-gray-50 border border-black/5 px-6 py-12 text-center text-sm text-gray-500">
                            Visual assets for this project are currently hidden.
                        </div>`
                    }
                </div>

                <div class="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-black/5 flex justify-between items-center">
                    <button onclick="closeModal()" class="text-[10px] font-bold tracking-widest uppercase hover:opacity-50 transition">Back to PROJECTS</button>
                    <button type="button" onclick="openNextProject()" class="text-[10px] font-bold tracking-widest uppercase hover:opacity-50 transition">Next Project &rarr;</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.scrollTo({ top: 0, behavior: 'auto' });
    initProjectImageMagnifier();

    const contentInner = document.getElementById('modal-content-inner');
    if (animateIn && contentInner) {
        contentInner.style.transition = 'none';
        contentInner.style.opacity = '0';
        contentInner.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                contentInner.style.transition = 'opacity 280ms ease, transform 280ms ease';
                contentInner.style.opacity = '1';
                contentInner.style.transform = 'translateY(0)';
            });
        });
    } else if (contentInner) {
        contentInner.style.transition = '';
        contentInner.style.opacity = '';
        contentInner.style.transform = '';
    }
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    const contentInner = document.getElementById('modal-content-inner');

    if (!modal || modal.classList.contains('hidden')) return;

    if (!contentInner) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        return;
    }

    contentInner.style.transition = 'opacity 220ms ease, transform 220ms ease';
    contentInner.style.opacity = '0';
    contentInner.style.transform = 'translateY(-14px)';

    window.setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        contentInner.style.transition = '';
        contentInner.style.opacity = '';
        contentInner.style.transform = '';
    }, 220);
}

function openNextProject() {
    if (!Array.isArray(currentProjects) || currentProjects.length === 0) return;
    if (currentModalProjectIndex < 0) return;
    const contentInner = document.getElementById('modal-content-inner');

    const nextIndex = (currentModalProjectIndex + 1) % currentProjects.length;
    const nextProject = currentProjects[nextIndex];
    if (!nextProject) return;

    if (!contentInner) {
        openModal(nextProject.id, { animateIn: true });
        return;
    }

    contentInner.style.transition = 'opacity 220ms ease, transform 220ms ease';
    contentInner.style.opacity = '0';
    contentInner.style.transform = 'translateY(-20px)';
    window.setTimeout(() => {
        openModal(nextProject.id, { animateIn: true });
    }, 220);
}

function initScrollAnimations() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section > div, .project-card').forEach(el => {
        observer.observe(el);
    });
}

function initHeroProjectScrubber(projects) {
    const interactiveArea = document.getElementById('hero-interactive-area');
    const scrubber = document.getElementById('hero-project-scrubber');
    const trigger = document.getElementById('hero-project-trigger');
    const image = document.getElementById('hero-project-image');
    const fallback = document.getElementById('hero-project-fallback');
    const fallbackText = document.getElementById('hero-project-fallback-text');
    if (!interactiveArea || !scrubber || !trigger || !image || !fallback || !fallbackText) return;
    if (!Array.isArray(projects) || projects.length === 0) return;

    let currentIndex = 0;
    let isDissolving = false;
    let queuedIndex = null;
    const total = projects.length;

    image.style.transition = 'opacity 150ms ease';

    const applyProjectImage = (safeIndex) => {
        const project = projects[safeIndex];
        if (!project) return;
        currentIndex = safeIndex;
        const previewImage = resolveProjectPreviewImage(project);
        image.alt = project.title;
        if (previewImage) {
            image.src = previewImage;
            image.style.opacity = '0.3';
            fallback.classList.add('hidden');
        } else {
            image.removeAttribute('src');
            image.style.opacity = '0';
            fallbackText.textContent = project.title || 'Preview Projects';
            fallback.classList.remove('hidden');
        }
    };

    const setActiveProject = (index, immediate = false) => {
        const safeIndex = Math.max(0, Math.min(total - 1, index));
        if (safeIndex === currentIndex && !isDissolving) return;

        if (immediate) {
            applyProjectImage(safeIndex);
            return;
        }

        if (isDissolving) {
            queuedIndex = safeIndex;
            return;
        }

        isDissolving = true;
        image.style.opacity = '0';
        window.setTimeout(() => {
            applyProjectImage(safeIndex);
            isDissolving = false;
            if (queuedIndex !== null && queuedIndex !== currentIndex) {
                const nextIndex = queuedIndex;
                queuedIndex = null;
                setActiveProject(nextIndex, false);
            } else {
                queuedIndex = null;
            }
        }, 150);
    };

    interactiveArea.addEventListener('mousemove', (event) => {
        const rect = interactiveArea.getBoundingClientRect();
        if (rect.width <= 0) return;
        const currentX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const ratio = rect.width <= 1 ? 0 : currentX / (rect.width - 1);
        const nextIndex = Math.max(0, Math.min(total - 1, Math.round(ratio * (total - 1))));
        if (nextIndex !== currentIndex) setActiveProject(nextIndex, false);
    });

    trigger.addEventListener('click', () => {
        const activeProject = projects[currentIndex];
        if (!activeProject) return;
        openModal(activeProject.id);
    });

    setActiveProject(0, true);
}

function initFadeVisibilityAnimations() {
    const fadeTargets = document.querySelectorAll('.hero-fade-down, .about-fade-down-target');
    if (fadeTargets.length === 0) return;

    const visibilityState = new WeakMap();
    const ENTER_RATIO = 0.3;
    const EXIT_RATIO = 0.12;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const wasVisible = visibilityState.get(entry.target) || false;
            const ratio = entry.intersectionRatio;

            if (!wasVisible && entry.isIntersecting && ratio >= ENTER_RATIO) {
                visibilityState.set(entry.target, true);
                entry.target.classList.add('is-visible');
                return;
            }

            if (wasVisible && (!entry.isIntersecting || ratio <= EXIT_RATIO)) {
                visibilityState.set(entry.target, false);
                entry.target.classList.remove('is-visible');
            }
        });
    }, {
        threshold: [0, EXIT_RATIO, ENTER_RATIO, 1]
    });

    fadeTargets.forEach((target) => {
        visibilityState.set(target, false);
        observer.observe(target);
    });
}
