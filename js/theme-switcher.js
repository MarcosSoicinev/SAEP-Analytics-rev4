/* ============================================================
   SAEP Analytics — theme-switcher.js
   Apenas alterna a classe dark-mode no <html>.
   Todo o visual está nas variáveis CSS do style.css.
============================================================ */

const THEME_KEY  = 'saep-theme';
const DARK       = 'dark';
const LIGHT      = 'light';

function saved() {
    return localStorage.getItem(THEME_KEY) ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT);
}

function apply(theme) {
    document.documentElement.classList.toggle('dark-mode', theme === DARK);
    localStorage.setItem(THEME_KEY, theme);
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) icon.className = theme === DARK ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function injectBtn() {
    const nav = document.querySelector('.nav-right');
    if (!nav || document.getElementById('themeToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'upload-btn';
    btn.style.cursor = 'pointer';
    btn.innerHTML = `<i class="${saved() === DARK ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}"></i><span>Tema</span>`;
    btn.onclick = () => apply(saved() === DARK ? LIGHT : DARK);
    nav.insertBefore(btn, nav.firstChild);
}

function boot() { apply(saved()); injectBtn(); }

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
