'use strict';
// Deliberately inert: no SDK, iframe, request, or live payment URL is loaded.
const form = document.querySelector('#donation-form');
const custom = document.querySelector('#custom-amount');
const modal = document.querySelector('#notice');
const language = document.documentElement.lang;
const dictionary = window.PAGE_TRANSLATIONS[language] || window.PAGE_TRANSLATIONS.en;
const t = (key, values = {}) => dictionary.runtime[key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
const text = value => dictionary.text[value] || value;
const currency = amount => new Intl.NumberFormat(language, {style:'currency', currency:'USD', maximumFractionDigits:2}).format(amount);
let previousFocus;
function showNotice(title, text) {
  previousFocus = document.activeElement;
  document.querySelector('#notice-title').textContent = title;
  document.querySelector('#notice-text').textContent = text;
  modal.showModal();
}
function selection() {
  const selected = form.elements.amount.value;
  return { amount: selected === 'other' ? Number(custom.value) : Number(selected), monthly: form.elements.frequency.value === 'monthly' };
}
function update() {
  const other = form.elements.amount.value === 'other';
  custom.disabled = !other;
  custom.required = other;
  document.querySelector('#custom-wrap').hidden = !other;
  const {amount, monthly} = selection();
  const valid = Number.isFinite(amount) && amount >= 1 && amount <= 1000000;
  const formatted = valid ? currency(amount).replace(/\.00$/, '') : t('gift');
  document.querySelector('#checkout').textContent = `${formatted}${t(monthly ? 'month' : 'once')} · ${t('demo')}`;
  document.querySelector('#impact-text').textContent = amount === 25 && monthly ? text('$25/month helps provide education and daily meals for a child.') : t('impact', {amount:formatted, period:monthly ? t('each') : ''});
}
form.addEventListener('change', update);
custom.addEventListener('input', () => { custom.setCustomValidity(''); update(); });
custom.addEventListener('invalid', () => custom.setCustomValidity(t('invalid')));
form.addEventListener('change', () => custom.setCustomValidity(''));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const {amount, monthly} = selection();
  if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) return;
  showNotice(t('thanks'), t('selected', {amount:currency(amount), period:t(monthly ? 'month' : 'once')}));
});
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  const name = button.dataset.demo;
  const label = text(name === 'Website' ? 'Site' : name);
  showNotice(label, t(['Venmo','PayPal','Cash App'].includes(name) ? 'payment' : 'placeholder', {name:label}));
}));
document.querySelectorAll('.close,.dismiss').forEach(button => button.addEventListener('click', () => modal.close()));
modal.addEventListener('close', () => previousFocus?.focus());
update();
