'use strict';
// GivingFuel owns the cross-origin checkout. Parent code never reads payment fields.
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
