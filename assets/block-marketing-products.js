(function() {
	const grids = document.querySelectorAll('[data-expandable-grid]');

	grids.forEach(function(grid) {
		const trigger = grid.parentElement.querySelector('[data-expandable-trigger]');
		const visibleRows = parseInt(grid.dataset.visibleRows, 10) || 0;
		const items = grid.querySelectorAll('.block-marketing-products__item');

		if (!trigger || visibleRows === 0) {
			items.forEach(function(item) { item.hidden = false; });
			if (trigger) trigger.parentElement.hidden = true;
			return;
		}

		const collapsedLabel = trigger.querySelector('[data-label-collapsed]');
		const expandedLabel = trigger.querySelector('[data-label-expanded]');

		let isExpanded = false;

		function getColumnCount() {
			const gridStyle = getComputedStyle(grid);
			const columns = gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length;
			return columns || 4;
		}

		function updateVisibility() {
			const columns = getColumnCount();
			const visibleCount = visibleRows * columns;

			if (items.length <= visibleCount) {
				trigger.parentElement.hidden = true;
				items.forEach(function(item) { item.hidden = false; });
				return;
			}

			trigger.parentElement.hidden = false;

			items.forEach(function(item, index) {
				item.hidden = index >= visibleCount && !isExpanded;
			});
		}

		function setState(expanded) {
			isExpanded = expanded;
			trigger.setAttribute('aria-expanded', expanded);
			grid.classList.toggle('is-expanded', expanded);
			if (collapsedLabel) collapsedLabel.hidden = expanded;
			if (expandedLabel) expandedLabel.hidden = !expanded;
			updateVisibility();
		}

		setState(false);

		let resizeTimeout;
		window.addEventListener('resize', function() {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(updateVisibility, 100);
		});

		trigger.addEventListener('click', function() {
			setState(!isExpanded);
		});
	});
})();
