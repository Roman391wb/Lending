const siteConfig = {
    telegramUrl: 'https://t.me/bsnemeje77'
};

const formatMoney = (value) =>
    `${Math.round(value).toLocaleString('ru-RU')} ₽`;

const formatPercent = (value) =>
    `${Number.isFinite(value) ? value.toFixed(1).replace('.', ',') : '0,0'}%`;

const getNumber = (id, fallback = 0) => {
    const element = document.getElementById(id);
    const value = Number.parseFloat(element?.value);
    return Number.isFinite(value) ? Math.max(value, 0) : fallback;
};

const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
};

function updateTelegramLinks() {
    document.querySelectorAll('#telegramLink, #footerTelegramLink').forEach((link) => {
        link.href = siteConfig.telegramUrl;
    });
}

function setupMenu() {
    const button = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!button || !menu) return;

    const closeMenu = () => {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
        document.body.classList.remove('menu-open');
    };

    button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isOpen));
        menu.classList.toggle('active', !isOpen);
        document.body.classList.toggle('menu-open', !isOpen);
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', href);
        });
    });
}

function updateCalculator() {
    const sellPrice = getNumber('sellPrice');
    const costPrice = getNumber('costPrice');
    const wbCommission = getNumber('wbCommission');
    const logistics = getNumber('logistics');
    const packaging = getNumber('packaging');
    const advertising = getNumber('advertising');
    const otherExpenses = getNumber('otherExpenses');
    const quantity = Math.max(1, Math.round(getNumber('quantity', 1)));

    // Transparent unit-economics model:
    // expenses per unit = purchase cost + WB commission + logistics + packaging + ads + other costs.
    const commissionAmount = sellPrice * (wbCommission / 100);
    const expensesPerUnit = costPrice + commissionAmount + logistics + packaging + advertising + otherExpenses;
    const unitProfit = sellPrice - expensesPerUnit;
    const revenue = sellPrice * quantity;
    const totalExpenses = expensesPerUnit * quantity;
    const totalProfit = unitProfit * quantity;
    const margin = sellPrice > 0 ? (unitProfit / sellPrice) * 100 : 0;
    const roi = expensesPerUnit > 0 ? (unitProfit / expensesPerUnit) * 100 : 0;

    setText('revenue', formatMoney(revenue));
    setText('totalExpenses', formatMoney(totalExpenses));
    setText('unitProfit', formatMoney(unitProfit));
    setText('totalProfit', formatMoney(totalProfit));
    setText('margin', formatPercent(margin));
    setText('roi', formatPercent(roi));

    const status = document.getElementById('profitStatus');
    const unitProfitElement = document.getElementById('unitProfit');
    const totalProfitElement = document.getElementById('totalProfit');

    if (!status) return;

    status.classList.remove('positive', 'negative');
    unitProfitElement?.classList.remove('good', 'bad');
    totalProfitElement?.classList.remove('good', 'bad');

    if (unitProfit > 0) {
        status.textContent = 'Позитивный сценарий: товар показывает прибыль в этой модели';
        status.classList.add('positive');
        unitProfitElement?.classList.add('good');
        totalProfitElement?.classList.add('good');
    } else if (unitProfit < 0) {
        status.textContent = 'Предупреждение: при этих вводных товар убыточен';
        status.classList.add('negative');
        unitProfitElement?.classList.add('bad');
        totalProfitElement?.classList.add('bad');
    } else {
        status.textContent = 'Нулевая прибыль: проверьте цену, расходы и рекламный бюджет';
    }
}

function setupCalculator() {
    const inputIds = [
        'sellPrice',
        'costPrice',
        'wbCommission',
        'logistics',
        'packaging',
        'advertising',
        'otherExpenses',
        'quantity'
    ];

    inputIds.forEach((id) => {
        document.getElementById(id)?.addEventListener('input', updateCalculator);
    });

    updateCalculator();
}

function setupFaq() {
    document.querySelectorAll('.faq-question').forEach((button) => {
        button.addEventListener('click', () => {
            const item = button.closest('.faq-item');
            const answer = item?.querySelector('.faq-answer');
            if (!item || !answer) return;

            const isOpen = item.classList.toggle('active');
            button.setAttribute('aria-expanded', String(isOpen));
            answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : '0px';

            document.querySelectorAll('.faq-item.active').forEach((otherItem) => {
                if (otherItem === item) return;
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                if (otherAnswer) otherAnswer.style.maxHeight = '0px';
            });
        });
    });
}

function setupForm() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const contact = String(formData.get('contact') || '').trim();
        const message = String(formData.get('message') || '').trim();

        status.classList.remove('error', 'ready');

        if (!name || !contact || !message) {
            status.textContent = 'Заполните имя, Telegram или телефон и короткий вопрос.';
            status.classList.add('error');
            return;
        }

        const draft = [
            'Заявка на консультацию по Wildberries',
            `Имя: ${name}`,
            `Контакт: ${contact}`,
            `Вопрос: ${message}`
        ].join('\n');

        localStorage.setItem('wb-academy-application-draft', draft);
        status.textContent = 'Заявка не отправлена на сервер: backend пока не подключён. Черновик сохранён в браузере, отправьте его через Telegram.';
        status.classList.add('ready');

        const telegramLink = document.getElementById('telegramLink');
        if (telegramLink) {
            telegramLink.href = `${siteConfig.telegramUrl}?text=${encodeURIComponent(draft)}`;
            telegramLink.focus();
        }
    });
}

function setupReveal() {
    const elements = document.querySelectorAll('.section-reveal');

    if (!('IntersectionObserver' in window)) {
        elements.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', () => {
    updateTelegramLinks();
    setupMenu();
    setupSmoothScroll();
    setupCalculator();
    setupFaq();
    setupForm();
    setupReveal();
});
