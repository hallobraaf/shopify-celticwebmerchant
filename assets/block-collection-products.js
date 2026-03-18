/**
 * =============================================================================
 * BLOCK-COLLECTION-PRODUCTS
 * ProductFilter – AJAX filtering with drawer, bar, and pills sync
 * =============================================================================
 */

if (!customElements.get('product-filter')) {
  class ProductFilter extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.sectionId;
      this.sectionEl = document.getElementById(`shopify-section-${this.sectionId}`);
      this.autoSubmit = this.dataset.autoSubmit === 'true';

      // Find elements
      this.drawer = this.querySelector(`[data-drawer="filter-drawer-${this.sectionId}"]`);
      this.openBtn = this.querySelector('.product-filter__open');
      this.formBar = this.querySelector(`#BarFiltersForm-${this.sectionId}`);
      this.formDrawer = this.querySelector(`#DrawerFiltersForm-${this.sectionId}`);

      this.initForms();
      this.initPills();
      this.initPriceRange();
      if (this.dataset.autoFill === 'true') this.initAutofill();
    }

    /* ── FORMS ──────────────────────────────────────────────────────────── */
    initForms() {
      [this.formBar, this.formDrawer].forEach(form => {
        if (!form) return;

        form.addEventListener('change', (e) => {
          // Sync checkbox between bar and drawer
          this.syncCheckbox(e.target);

          if (this.autoSubmit) {
            // Auto-submit ON: page navigation
            form.submit();
          } else {
            // Auto-submit OFF: AJAX update
            this.fetchFiltered(this.buildUrl(form));
          }
        });

        form.addEventListener('submit', (e) => {
          // "Toepassen" button has data-mode="page" -> let it through
          if (e.submitter?.dataset.mode === 'page') return;

          e.preventDefault();
          this.fetchFiltered(this.buildUrl(form));
        });
      });

      // Bar accordion behavior
      this.initBarAccordion();
    }

    syncCheckbox(input) {
      if (input.type !== 'checkbox') return;
      const otherForm = input.closest('form') === this.formBar ? this.formDrawer : this.formBar;
      if (!otherForm) return;

      const match = otherForm.querySelector(`input[name="${input.name}"][value="${input.value}"]`);
      if (match) match.checked = input.checked;
    }

    initBarAccordion() {
      const groups = this.formBar?.querySelector('.facets__groups');
      if (!groups) return;

      groups.addEventListener('click', (e) => {
        const summary = e.target.closest('summary');
        if (!summary) return;
        const detail = summary.parentElement;
        if (!detail?.matches('details.facet')) return;

        e.preventDefault();
        const wasOpen = detail.hasAttribute('open');
        groups.querySelectorAll('details.facet[open]').forEach(el => el.removeAttribute('open'));
        if (!wasOpen) detail.setAttribute('open', '');

        // Re-measure after accordion state change
        this._measure?.();
      });

      document.addEventListener('click', (e) => {
        if (!groups.contains(e.target)) {
          groups.querySelectorAll('details.facet[open]').forEach(el => el.removeAttribute('open'));
          this._measure?.();
        }
      });
    }

    /* ── PILLS ──────────────────────────────────────────────────────────── */
    initPills() {
      this.sectionEl?.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-active-pills] a.pill');
        if (!pill) return;

        e.preventDefault();
        this.fetchFiltered(new URL(pill.href, location.origin));
      });
    }

    /* ── PRICE RANGE ────────────────────────────────────────────────────── */
    initPriceRange() {
      this.querySelectorAll('[data-price-range]').forEach(container => {
        const rangeMin = container.querySelector('[data-range-min]');
        const rangeMax = container.querySelector('[data-range-max]');
        const inputMin = container.querySelector('[data-input-min]');
        const inputMax = container.querySelector('[data-input-max]');

        if (!rangeMin || !rangeMax || !inputMin || !inputMax) return;

        // Range slider -> Input sync
        rangeMin.addEventListener('input', () => {
          const minVal = parseInt(rangeMin.value);
          const maxVal = parseInt(rangeMax.value);
          if (minVal > maxVal) rangeMin.value = maxVal;
          inputMin.value = rangeMin.value;
        });

        rangeMax.addEventListener('input', () => {
          const minVal = parseInt(rangeMin.value);
          const maxVal = parseInt(rangeMax.value);
          if (maxVal < minVal) rangeMax.value = minVal;
          inputMax.value = rangeMax.value;
        });

        // Input -> Range slider sync
        inputMin.addEventListener('input', () => {
          const val = parseInt(inputMin.value) || 0;
          rangeMin.value = Math.min(val, parseInt(rangeMax.value));
        });

        inputMax.addEventListener('input', () => {
          const val = parseInt(inputMax.value) || parseInt(rangeMax.max);
          rangeMax.value = Math.max(val, parseInt(rangeMin.value));
        });
      });
    }

    /* ── URL BUILDING ───────────────────────────────────────────────────── */
    buildUrl(form) {
      const url = new URL(location.pathname, location.origin);

      // Add all form data
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (value) url.searchParams.append(key, value);
      });

      // Always start at page 1 when filtering
      url.searchParams.delete('page');

      return url;
    }

    /* ── AJAX FETCH ─────────────────────────────────────────────────────── */
    async fetchFiltered(url) {
      // Add section parameter for Section Rendering API
      const fetchUrl = new URL(url);
      fetchUrl.searchParams.set('sections', this.sectionId);

      document.documentElement.classList.add('is-loading');

      try {
        const response = await fetch(fetchUrl.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const newHTML = data[this.sectionId];

        if (!newHTML) throw new Error('No section data');

        // Parse new HTML
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(newHTML, 'text/html');

        // Update product grid
        const newGrid = newDoc.querySelector('[data-product-grid]');
        const currentGrid = this.sectionEl.querySelector('[data-product-grid]');
        if (newGrid && currentGrid) {
          currentGrid.innerHTML = newGrid.innerHTML;
        }

        // Update pills
        const newPills = newDoc.querySelector('[data-active-pills]');
        const currentPills = this.sectionEl.querySelector('[data-active-pills]');
        if (newPills && currentPills) {
          currentPills.outerHTML = newPills.outerHTML;
        }

        // Update result counts (all instances)
        const newCount = newDoc.querySelector('[data-facets-resultcount]');
        if (newCount) {
          this.sectionEl.querySelectorAll('[data-facets-resultcount]').forEach(el => {
            el.innerHTML = newCount.innerHTML;
          });
        }

        // Sync facet states (counts, disabled, checked)
        this.syncFacetStates(newDoc);

        // Update browser URL
        history.replaceState({}, '', url.toString());

      } catch (error) {
        console.error('[ProductFilter] AJAX failed:', error);
        // Fallback: navigate to URL
        location.href = url.toString();
      } finally {
        document.documentElement.classList.remove('is-loading');
      }
    }

    syncFacetStates(newDoc) {
      // Sync bar form
      const newBar = newDoc.querySelector('.facets--bar');
      if (newBar && this.formBar) {
        this.syncFormFacets(this.formBar, newBar);
      }

      // Sync drawer form
      const newDrawer = newDoc.querySelector('.facets--drawer');
      if (newDrawer && this.formDrawer) {
        this.syncFormFacets(this.formDrawer, newDrawer);
      }
    }

    syncFormFacets(currentForm, newForm) {
      currentForm.querySelectorAll('li[data-value]').forEach(currentLi => {
        const param = currentLi.closest('[data-param]')?.dataset.param;
        const value = currentLi.dataset.value;
        if (!param || !value) return;

        const newLi = newForm.querySelector(
          `[data-param="${CSS.escape(param)}"] li[data-value="${CSS.escape(value)}"]`
        );
        if (!newLi) return;

        // Update count
        const currentQty = currentLi.querySelector('.facet__qty');
        const newQty = newLi.querySelector('.facet__qty');
        if (currentQty && newQty) {
          currentQty.textContent = newQty.textContent;
        }

        // Update input state
        const currentInput = currentLi.querySelector('input');
        const newInput = newLi.querySelector('input');
        if (currentInput && newInput) {
          currentInput.checked = newInput.checked;
          currentInput.disabled = newInput.disabled;
        }

        // Update label classes
        const currentLabel = currentLi.querySelector('.facet__check');
        const newLabel = newLi.querySelector('.facet__check');
        if (currentLabel && newLabel) {
          currentLabel.className = newLabel.className;
        }
      });
    }

    /* ── AUTOFILL (responsive bar) ──────────────────────────────────────── */
    initAutofill() {
      const groups = this.formBar?.querySelector('.facets__groups');
      if (!groups) return;

      // Get the parent container that has the fixed width
      const container = this.formBar?.closest('.product-filter__preview');
      if (!container) return;

      const measure = () => {
        const max = parseInt(this.dataset.maxPreview, 10) || 99;
        const items = [...groups.querySelectorAll('details.facet')];
        if (!items.length) return;

        // Step 1: Show all items first to measure them
        items.forEach(el => el.classList.remove('facet--hidden'));

        // Step 2: Calculate available width for facets
        // Container width minus other elements (sort, resultcount, filter button, gaps)
        const containerWidth = container.offsetWidth;
        const filterBtn = container.querySelector('.product-filter__open');
        const sortSelect = this.formBar.querySelector('.facets__sort');
        const resultCount = this.formBar.querySelector('.facets__resultcount');

        let reservedWidth = 0;
        if (filterBtn) reservedWidth += filterBtn.offsetWidth + 16; // + gap
        if (sortSelect) reservedWidth += sortSelect.offsetWidth + 8;
        if (resultCount) reservedWidth += resultCount.offsetWidth + 8;
        reservedWidth += 32; // extra padding/safety margin

        const availableWidth = containerWidth - reservedWidth;

        // Step 3: Measure each item's width
        const gap = parseFloat(getComputedStyle(groups).columnGap) || 8;
        let usedWidth = 0;
        let visibleCount = 0;

        items.forEach((el, i) => {
          if (i >= max) {
            el.classList.add('facet--hidden');
            return;
          }

          const itemWidth = el.offsetWidth + (i > 0 ? gap : 0);

          if (usedWidth + itemWidth <= availableWidth) {
            usedWidth += itemWidth;
            visibleCount++;
          } else {
            el.classList.add('facet--hidden');
          }
        });

        // Step 4: Update badge with hidden count
        const hiddenCount = items.length - visibleCount;
        let badge = this.openBtn?.querySelector('.badge');

        if (!badge && this.openBtn) {
          badge = document.createElement('span');
          badge.className = 'badge';
          this.openBtn.appendChild(badge);
        }

        if (badge) {
          badge.textContent = hiddenCount > 0 ? `+${hiddenCount}` : '';
          badge.hidden = hiddenCount <= 0;
        }
      };

      // Store measure function
      this._measure = measure;

      // Initial measure after fonts load
      if (document.fonts?.status === 'loaded') {
        requestAnimationFrame(measure);
      } else {
        document.fonts?.ready.then(() => requestAnimationFrame(measure));
      }

      // Re-measure on resize
      this._resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(measure);
      });
      this._resizeObserver.observe(container);
    }
  }

  customElements.define('product-filter', ProductFilter);
}
