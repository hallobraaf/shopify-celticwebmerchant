/**
 * block-header-bottom.js
 * Mega-menu panel rendering for Celtic WebMerchant
 *
 * Architecture: all menu data is serialised to JSON in the Liquid template.
 * A single shared panel is populated on hover, avoiding 7× duplicate dropdown
 * structures in the initial HTML. All <a href> links for SEO remain in the
 * DOM via .block-header-bottom__seo-links (visually hidden, crawlable).
 *
 * Public deps: window.themeLazy.loadNavigation (theme-lazyload.js)
 */
(function () {
	'use strict';

	// SVG sprite references — matches html-theme-icons.liquid output
	var SVG = {
		arrow: '<svg class="icon icon-arrow" width="16" height="16" fill="currentcolor" aria-hidden="true" focusable="false"><use href="#icon-arrow"></use></svg>',
		caret: '<svg class="icon icon-caret" width="16" height="16" fill="currentcolor" aria-hidden="true" focusable="false"><use href="#icon-caret"></use></svg>'
	};

	// --------------------------------------------------------------------
	// Utilities
	// --------------------------------------------------------------------

	function esc(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function navFigure(imageUrl, imageAlt, width, height) {
		return '<figure class="theme-media is-strategy-navigation"'
			+ ' data-nav-src="' + esc(imageUrl) + '"'
			+ ' data-nav-alt="' + esc(imageAlt || '') + '"'
			+ ' data-nav-width="' + width + '"'
			+ ' data-nav-height="' + height + '"'
			+ '></figure>';
	}

	// --------------------------------------------------------------------
	// HTML builders
	// --------------------------------------------------------------------

	/**
	 * Build inner content for the assist panel slot (<article>…</article>).
	 * Used both for the main panel slot and inlined in nested dropdowns.
	 */
	function buildAssistContent(assist) {
		var html = '<article class="block-header-bottom__assist-item">';

		if (assist.pageUrl) {
			html += '<a href="' + esc(assist.pageUrl) + '" class="block-header-bottom__assist-overlay"></a>';
		}

		if (assist.imageUrl) {
			html += '<div class="block-header-bottom__assist-image">'
				+ navFigure(assist.imageUrl, assist.title || '', 520, 780)
				+ '</div>';
		}

		html += '<section class="block-header-bottom__assist-content">'
			+ '<h3>' + esc(assist.title || '') + '</h3>';

		if (assist.pageUrl) {
			html += '<span class="block-header-bottom__assist-link">'
				+ '<span>' + esc(assist.linkText || '') + '</span>'
				+ '<i>' + SVG.arrow + '</i>'
				+ '</span>';
		}

		html += '</section></article>';
		return html;
	}

	/**
	 * Build a full assist <section> for embedding inside nested dropdowns.
	 */
	function buildAssistSection(assist) {
		return '<section class="block-header-bottom__assist">'
			+ buildAssistContent(assist)
			+ '</section>';
	}

	/**
	 * Build a single <li> for a child or subchild link.
	 * @param {object}  item       — link data object
	 * @param {object}  parentData — top-level item data (for nested navigate labels + assist)
	 * @param {boolean} isSubchild — true = no nested dropdown rendered
	 */
	function buildLinkItem(item, parentData, isSubchild) {
		var hasChildren = !isSubchild && item.links && item.links.length > 0;
		var html = '<li' + (hasChildren ? ' class="has-dropdown"' : '') + '>';

		// Link element
		html += '<a href="' + esc(item.url) + '" class="block-header-bottom__link">';

		if (item.imageUrl) {
			html += '<div class="block-header-bottom__link-image">'
				+ navFigure(item.imageUrl, item.imageAlt || '', 96, 96)
				+ '</div>';
		}

		html += '<span>' + esc(item.title) + '</span>';

		if (hasChildren) {
			html += '<i class="block-header-bottom__caret">' + SVG.caret + '</i>';
		}

		html += '</a>';

		// Nested dropdown
		if (hasChildren) {
			var hasAssist = !!(parentData && parentData.assist);

			html += '<div class="block-header-bottom__dropdown block-header-bottom__dropdown--nested">'
				+ '<div class="block-header-bottom__dropdown-inner is-align-wide'
				+ (hasAssist ? ' has-assist' : '') + '">'
				+ '<section class="block-header-bottom__links"><ul>';

			item.links.forEach(function (subchild) {
				html += buildLinkItem(subchild, parentData, true);
			});

			// Navigate bottom: back to parent + view all for this child
			html += '<li class="block-header-bottom__navigate block-header-bottom__navigate--bottom">'
				+ '<a href="' + esc(parentData.url) + '" class="block-header-bottom__link block-header-bottom__link--back">'
				+ '<i>' + SVG.arrow + '</i>'
				+ '<span>' + esc(parentData.title) + '</span>'
				+ '</a>'
				+ '<a href="' + esc(item.url) + '" class="block-header-bottom__link block-header-bottom__link--all">'
				+ '<span>' + esc(item.title) + '</span>'
				+ '<i>' + SVG.arrow + '</i>'
				+ '</a>'
				+ '</li>';

			html += '</ul></section>';

			if (hasAssist) {
				html += buildAssistSection(parentData.assist);
			}

			html += '</div></div>';
		}

		html += '</li>';
		return html;
	}

	/**
	 * Build all panel content for a top-level menu item.
	 * Returns { links: string, assistContent: string|null }
	 * Links content goes into <ul.panel-links>, assist into <section.assist>.
	 */
	function buildPanelContent(itemData) {
		var linksHtml = '';

		itemData.links.forEach(function (child) {
			linksHtml += buildLinkItem(child, itemData, false);
		});

		// Navigate bottom: "view all" for the top-level category
		linksHtml += '<li class="block-header-bottom__navigate block-header-bottom__navigate--bottom">'
			+ '<a href="' + esc(itemData.url) + '" class="block-header-bottom__link block-header-bottom__link--all">'
			+ '<span>' + esc(itemData.title) + '</span>'
			+ '<i>' + SVG.arrow + '</i>'
			+ '</a></li>';

		return {
			links: linksHtml,
			assistContent: itemData.assist ? buildAssistContent(itemData.assist) : null
		};
	}

	// --------------------------------------------------------------------
	// Nav instance initialisation
	// --------------------------------------------------------------------

	function initNav(wrapper) {
		var nav = wrapper.querySelector('.block-header-bottom__nav');
		if (!nav) return;

		var navId = wrapper.dataset.navId;
		var dataEl = document.getElementById('nav-data-' + navId);
		var panel  = document.getElementById('nav-panel-' + navId);
		if (!dataEl || !panel) return;

		var menuData;
		try {
			menuData = JSON.parse(dataEl.textContent);
		} catch (e) {
			console.error('[block-header-bottom] Failed to parse nav data:', e);
			return;
		}

		var panelLinks      = panel.querySelector('.block-header-bottom__panel-links');
		var panelAssistSlot = panel.querySelector('.block-header-bottom__assist');
		var dropdownInner   = panel.querySelector('.block-header-bottom__dropdown-inner');
		var cache           = {};   // built HTML per menu index
		var activeIndex     = -1;

		var topItems = Array.from(nav.querySelectorAll('.block-header-bottom__menu > li.has-dropdown'));

		// Walk up from li to find ancestor <li> elements within the nav
		function getAncestors(li) {
			var ancestors = [];
			var el = li.parentElement;
			while (el && el !== nav) {
				if (el.tagName === 'LI') ancestors.push(el);
				el = el.parentElement;
			}
			return ancestors;
		}

		function showPanel(index) {
			var itemData = menuData[index];
			if (!itemData) return;

			// Build and cache panel HTML
			if (!cache[index]) {
				cache[index] = buildPanelContent(itemData);
			}
			var built = cache[index];

			// Only update DOM if switching to a different item
			if (activeIndex !== index) {
				activeIndex = index;

				// Clear nested selection state
				panel.querySelectorAll('.is-selected').forEach(function (li) {
					li.classList.remove('is-selected');
				});

				panelLinks.innerHTML = built.links;

				if (built.assistContent) {
					panelAssistSlot.innerHTML = built.assistContent;
					panelAssistSlot.style.display = '';
					dropdownInner.classList.add('has-assist');
				} else {
					panelAssistSlot.style.display = 'none';
					panelAssistSlot.innerHTML = '';
					dropdownInner.classList.remove('has-assist');
				}
			}

			panel.classList.add('is-open');
			nav.classList.add('has-panel-open');

			// Inject deferred nav images
			if (window.themeLazy) window.themeLazy.loadNavigation(panel);
		}

		function hidePanel() {
			panel.classList.remove('is-open');
			nav.classList.remove('has-panel-open');
			panel.querySelectorAll('.is-selected').forEach(function (li) {
				li.classList.remove('is-selected');
			});
			activeIndex = -1;
		}

		// ---- Mouse events ------------------------------------------------

		topItems.forEach(function (topItem) {
			topItem.addEventListener('mouseenter', function () {
				showPanel(parseInt(topItem.dataset.menuIndex, 10));
			});
		});

		nav.addEventListener('mouseleave', hidePanel);

		// ---- Focus events (keyboard navigation) --------------------------

		topItems.forEach(function (topItem) {
			topItem.addEventListener('focusin', function () {
				if (topItem.classList.contains('has-dropdown')) {
					showPanel(parseInt(topItem.dataset.menuIndex, 10));
				}
			});
		});

		nav.addEventListener('focusout', function (e) {
			if (!nav.contains(e.relatedTarget)) {
				hidePanel();
			}
		});

		// ---- Click events (nested dropdowns + back buttons) --------------

		nav.addEventListener('click', function (e) {
			// Toggle nested dropdown on click (desktop hover already handles it,
			// but mobile users tap links inside the panel)
			var nestedLink = e.target.closest('.has-dropdown > .block-header-bottom__link');
			if (nestedLink) {
				var li = nestedLink.closest('li');
				if (li && li.closest('.block-header-bottom__dropdown')) {
					e.preventDefault();
					var ancestors = getAncestors(li);
					panel.querySelectorAll('li').forEach(function (item) {
						if (ancestors.indexOf(item) !== -1) {
							item.classList.add('is-selected');
						} else if (item === li) {
							item.classList.toggle('is-selected');
						} else {
							item.classList.remove('is-selected');
						}
					});
					// Load images on click (lazy for mobile)
					if (li.classList.contains('is-selected') && window.themeLazy) {
						window.themeLazy.loadNavigation(li);
					}
				}
			}

			// Back button: collapse the innermost open nested dropdown
			var backLink = e.target.closest('.block-header-bottom__link--back');
			if (backLink) {
				e.preventDefault();
				var li = backLink.closest('li');
				if (li) {
					var ancestors = getAncestors(li);
					if (ancestors.length > 0) ancestors[0].classList.remove('is-selected');
				}
			}
		});
	}

	// --------------------------------------------------------------------
	// Bootstrap
	// --------------------------------------------------------------------

	function init() {
		document.querySelectorAll('.block-header-bottom__wrapper[data-nav-id]').forEach(initNav);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Shopify Theme Editor: reinit after section reload
	document.addEventListener('shopify:section:load', function (e) {
		var wrapper = e.target.querySelector('.block-header-bottom__wrapper[data-nav-id]');
		if (wrapper) initNav(wrapper);
	});
})();
