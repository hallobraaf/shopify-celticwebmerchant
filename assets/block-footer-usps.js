class FooterUsps extends HTMLElement {
	connectedCallback() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this._initWhenReady());
		} else {
			this._initWhenReady();
		}
	}

	_initWhenReady() {
		this.wrapper = this.querySelector('.block-footer-usps__wrapper');
		this.swiperEl = this.querySelector('[data-footer-usps-slider]');
		this.prevBtn = this.querySelector('[data-nav-prev]');
		this.nextBtn = this.querySelector('[data-nav-next]');

		if (!this.swiperEl || !this.wrapper) return;
		this.initSwiper();
	}

	disconnectedCallback() {
		if (this.slider) {
			this.slider.destroy(true, true);
			this.slider = null;
		}
	}

	areAllSlidesInView(swiper) {
		var slidesWidth = Array.from(swiper.slides).reduce(function(total, slide, index) {
			return total + slide.offsetWidth + (index < swiper.slides.length - 1 ? swiper.params.spaceBetween : 0);
		}, 0);
		return slidesWidth <= swiper.width;
	}

	updateLayout(swiper) {
		var wrapper = swiper.el.querySelector('.swiper-wrapper');
		if (!wrapper) return;

		if (this.areAllSlidesInView(swiper)) {
			wrapper.style.justifyContent = 'center';
			this.wrapper.classList.remove('has-overflow');
		} else {
			wrapper.style.justifyContent = '';
			this.wrapper.classList.add('has-overflow');
		}
	}

	initSwiper() {
		var self = this;

		this.slider = new Swiper(this.swiperEl, {
			direction: 'horizontal',
			centeredSlides: false,
			slidesPerView: 'auto',
			slidesPerGroup: 1,
			spaceBetween: 32,
			loop: false,
			autoplay: false,
			mousewheel: {
				forceToAxis: true,
				releaseOnEdges: true
			},
			navigation: {
				prevEl: this.prevBtn,
				nextEl: this.nextBtn
			},
			on: {
				init: function(swiper) {
					self.updateLayout(swiper);
				},
				resize: function(swiper) {
					self.updateLayout(swiper);
				}
			}
		});
	}
}

customElements.define('footer-usps', FooterUsps);
