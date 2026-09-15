// Keyboard access and state announcements for the AcademicPages navigation.
const navButton = document.querySelector('#site-nav > button');
const mobileNavigation = document.querySelector('#mobile-navigation');
function syncNavigation() {
  navButton?.setAttribute('aria-expanded', String(!mobileNavigation?.classList.contains('hidden')));
}
if (mobileNavigation) {
  new MutationObserver(syncNavigation).observe(mobileNavigation, { attributes: true, attributeFilter: ['class'] });
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navButton?.getAttribute('aria-expanded') === 'true') {
    navButton.click();
    navButton.focus();
  }
});
