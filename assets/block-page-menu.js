(function() {
	const drawer = document.getElementById('mobile-nav-drawer');
	if (!drawer) return;

	// Toggle buttons for submenus
	drawer.addEventListener('click', (e) => {
		const toggle = e.target.closest('.block-page-menu__toggle');
		if (toggle) {
			const expanded = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', !expanded);
		}
	});

	// Listen for legacy events (backward compatibility with header-middle trigger)
	document.addEventListener('mobile-nav:open', () => {
		if (window.themeDrawer) window.themeDrawer.open('mobile-nav');
	});
	document.addEventListener('mobile-nav:close', () => {
		if (window.themeDrawer) window.themeDrawer.close('mobile-nav');
	});
	document.addEventListener('mobile-nav:toggle', () => {
		if (window.themeDrawer) {
			if (window.themeDrawer.isOpen('mobile-nav')) {
				window.themeDrawer.close('mobile-nav');
			} else {
				window.themeDrawer.open('mobile-nav');
			}
		}
	});
})();
