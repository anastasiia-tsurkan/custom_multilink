'use strict';
// Deliberately inert: no SDK, iframe, request, or live payment URL is loaded.
const form = document.querySelector('#donation-form');
const custom = document.querySelector('#custom-amount');
const modal = document.querySelector('#notice');
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
  const formatted = valid ? new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(amount).replace(/\.00$/, '') : 'Your gift';
  document.querySelector('#checkout').textContent = `${formatted}${monthly ? ' per month' : ' one-time'} · GivingFuel demo`;
  document.querySelector('#impact-text').textContent = amount === 25 && monthly ? '$25/month helps provide education and daily meals for a child.' : `${formatted}${monthly ? ' each month' : ''} can help support education and daily meals.`;
}
form.addEventListener('change', update);
custom.addEventListener('input', update);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const {amount, monthly} = selection();
  if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) return;
  showNotice('Thank you for your generosity', `You selected $${amount.toLocaleString('en-US', {maximumFractionDigits:2})}${monthly ? ' monthly' : ' one-time'}. This is a demonstration of the GivingFuel form. No payment has been made and no information has been sent.`);
});
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  const name = button.dataset.demo;
  showNotice(name, ['Venmo','PayPal','Cash App'].includes(name) ? `${name} donations are not connected in this preview. No payment will be made.` : `${name} content or link will be added after approval. This placeholder does not open an external website.`);
}));
document.querySelectorAll('.close,.dismiss').forEach(button => button.addEventListener('click', () => modal.close()));
modal.addEventListener('close', () => previousFocus?.focus());
update();
