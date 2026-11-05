import { useEffect } from 'react';

// Dialogs, dropdown menus and selects block clicks on the rest of the page by
// setting `pointer-events: none` on <body> while they are open. If one is
// removed while it is still closing (for example, the screen behind it changes
// right after an invoice or quote is sent), that style can be left behind and
// the whole app stops responding to clicks until the page is refreshed.
// This clears the leftover style whenever nothing is actually open.
const OPEN_LAYER_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="menu"][data-state="open"]',
  '[role="listbox"][data-state="open"]',
].join(',');

const CHECK_DELAY_MS = 300;

export const StuckPageGuard = () => {
  useEffect(() => {
    let timer: number | undefined;

    const scheduleCheck = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const { body } = document;
        if (body.style.pointerEvents !== 'none') return;
        if (document.querySelector(OPEN_LAYER_SELECTOR)) return;
        body.style.removeProperty('pointer-events');
      }, CHECK_DELAY_MS);
    };

    // Dialog portals are added to and removed from <body> directly, and the
    // lock itself is a body style, so watching <body> covers both.
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
    });

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
};
