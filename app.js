'use strict';
// Donations use ordinary external links. No payment fields or SDK run on this site.
const modal = document.querySelector('#notice');
const language = document.documentElement.lang;
const dictionary = window.PAGE_TRANSLATIONS[language] || window.PAGE_TRANSLATIONS.en;
let previousFocus;
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  previousFocus = document.activeElement;
  const label = dictionary.text[button.dataset.demo] || button.dataset.demo;
  document.querySelector('#notice-title').textContent = label;
  document.querySelector('#notice-text').textContent = dictionary.runtime.placeholder.replace('{name}', label);
  modal.showModal();
}));
document.querySelectorAll('.close,.dismiss').forEach(button => button.addEventListener('click', () => modal.close()));
modal.addEventListener('close', () => previousFocus?.focus());
