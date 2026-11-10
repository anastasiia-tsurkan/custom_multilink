'use strict';
// GivingFuel owns the cross-origin checkout. Parent code never reads or processes payment fields.
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

// GivingFuel includes the matching iframe-resizer child script on its pages.
// Accept resize messages only from the payment provider; leave scrolling available
// if the provider script is blocked or a later checkout step grows taller.
const checkoutFrame = document.querySelector('#givingfuel-checkout');
if (checkoutFrame && typeof window.iFrameResize === 'function') {
  window.iFrameResize({
    checkOrigin: ['https://imoce.givingfuel.com'],
    heightCalculationMethod: 'bodyOffset',
    sizeWidth: false,
    scrolling: true,
    minHeight: 300,
    warningTimeout: 0
  }, checkoutFrame);
}
