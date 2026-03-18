(function() {
	const blocks = document.querySelectorAll('[data-readmore]');
	blocks.forEach(function(block) {
		const btn = block.querySelector('button[aria-expanded]');
		if (!btn) return;

		const maxParas = parseInt(block.dataset.readmoreParagraphs || '1', 10);
		const selector = block.dataset.readmoreSelector || ':scope > p, :scope > .readmore-item';
		const trimEmpty = (block.dataset.readmoreTrimEmpty || 'true') === 'true';

		const collapsedLabel = btn.querySelector('[data-label-collapsed]');
		const expandedLabel = btn.querySelector('[data-label-expanded]');

		let countables = Array.from(block.querySelectorAll(selector))
			.filter(function(el) { return el.parentElement === block && el !== btn; });

		if (trimEmpty) {
			countables = countables.filter(function(el) {
				if (el.tagName !== 'P') return true;
				const txt = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
				if (!txt) { el.remove(); return false; }
				return true;
			});
		}

		if (countables.length <= maxParas) {
			btn.remove();
			return;
		}

		function setState(expanded) {
			block.setAttribute('data-readmore', expanded ? 'expanded' : 'collapsed');
			btn.setAttribute('aria-expanded', expanded);
			if (collapsedLabel) collapsedLabel.hidden = expanded;
			if (expandedLabel) expandedLabel.hidden = !expanded;

			countables.forEach(function(el, i) {
				el.hidden = i >= maxParas && !expanded;
			});
		}

		setState(false);

		btn.addEventListener('click', function() {
			const expanded = btn.getAttribute('aria-expanded') === 'true';
			setState(!expanded);
		});
	});
})();
