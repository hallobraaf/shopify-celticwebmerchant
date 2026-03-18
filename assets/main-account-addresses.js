(function() {
  const section = document.querySelector('[data-account-addresses]');
  if (!section) return;

  // Toggle add/edit form visibility
  section.querySelectorAll('button[aria-controls]').forEach(function(button) {
    button.addEventListener('click', function() {
      const target = document.getElementById(button.getAttribute('aria-controls'));
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      button.setAttribute('aria-expanded', String(!isExpanded));
      target.hidden = isExpanded;

      if (!isExpanded) {
        const firstInput = target.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    });
  });

  // Cancel buttons — hide form and reset toggle state
  section.querySelectorAll('button[type="reset"]').forEach(function(button) {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const wrapper = button.closest('.main-account-addresses__form-wrapper');
      const toggleButton = section.querySelector('[aria-controls="' + wrapper.id + '"]');

      wrapper.hidden = true;
      if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
    });
  });

  // Delete address
  section.querySelectorAll('[data-target][data-confirm-message]').forEach(function(button) {
    button.addEventListener('click', function() {
      if (!confirm(button.dataset.confirmMessage)) return;

      const form = document.createElement('form');
      form.method = 'post';
      form.action = button.dataset.target;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_method';
      input.value = 'delete';
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
    });
  });

  // Country/Province selector
  if (typeof Shopify !== 'undefined' && Shopify.CountryProvinceSelector) {
    section.querySelectorAll('[data-address-country-select]').forEach(function(select) {
      const formId = select.dataset.formId || 'New';
      const suffix = formId === 'New' ? 'New' : '_' + formId;
      new Shopify.CountryProvinceSelector(
        'AddressCountry' + suffix,
        'AddressProvince' + suffix,
        { hideElement: 'AddressProvinceContainer' + suffix }
      );
    });
  }
})();
