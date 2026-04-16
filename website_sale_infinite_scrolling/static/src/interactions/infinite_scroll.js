/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const MODE_INFINITE = 'infinite';
const MODE_LOAD_MORE = 'load_more';

publicWidget.registry.infiniteScroll = publicWidget.Widget.extend({
    selector: '#o_infinite_scroll_sentinel',

    /**
     * @override
     */
    start: function () {
        var def = this._super.apply(this, arguments);

        this._mode = MODE_INFINITE; // Default: infinite scroll
        this._currentPage = 1;
        this._hasMore = true;
        this._loading = false;
        this._observer = null;

        this._spinnerEl = this.el.querySelector('.o_infinite_scroll_spinner');
        this._loadMoreBtnEl = this.el.querySelector('.o_load_more_btn');
        this._endEl = this.el.querySelector('.o_infinite_scroll_end');
        this._gridEl = document.querySelector('#o_wsale_products_grid');
        this._pagerEl = document.querySelector('.products_pager');

        if (!this._gridEl) return def;

        // Read mode from body data attribute (set via website settings or default)
        const bodyMode = document.body.dataset.infiniteScrollMode;
        this._mode = bodyMode === 'load_more' ? MODE_LOAD_MORE : MODE_INFINITE;

        // Check if there's a next page
        this._hasMore = this._detectHasMore();

        if (!this._hasMore) {
            this._showEnd();
            return def;
        }

        // Hide default pagination
        if (this._pagerEl) {
            this._pagerEl.style.display = 'none';
        }

        if (this._mode === MODE_LOAD_MORE) {
            this._showLoadMoreButton();
        } else {
            this._setupIntersectionObserver();
        }

        return def;
    },

    /**
     * @override
     */
    destroy: function () {
        if (this._observer) {
            this._observer.disconnect();
        }
        this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _detectHasMore: function () {
        if (!this._pagerEl) return false;
        // Check for a "next" link in the pager
        const nextLink = this._pagerEl.querySelector(
            'a[aria-label="Next"], .o_next, [rel="next"], li:last-child a'
        );
        return !!nextLink;
    },

    /**
     * @private
     */
    _getNextPageUrl: function () {
        if (!this._pagerEl) return null;
        const nextLink = this._pagerEl.querySelector(
            'a[aria-label="Next"], .o_next, [rel="next"], li:last-child a'
        );
        return nextLink ? nextLink.href : null;
    },

    /**
     * @private
     */
    _setupIntersectionObserver: function () {
        this._spinnerEl && this._spinnerEl.classList.remove('d-none');
        // Show spinner as sentinel
        this._observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !this._loading && this._hasMore) {
                    this._loadNextPage();
                }
            },
            { rootMargin: '200px' }
        );
        this._observer.observe(this.el);
    },

    /**
     * @private
     */
    _showLoadMoreButton: function () {
        this._loadMoreBtnEl && this._loadMoreBtnEl.classList.remove('d-none');
        if (this._loadMoreBtnEl) {
            this._loadMoreBtnEl.addEventListener('click', () => {
                if (!this._loading && this._hasMore) {
                    this._loadNextPage();
                }
            });
        }
    },

    /**
     * @private
     */
    _loadNextPage: async function () {
        if (this._loading || !this._hasMore) return;
        this._loading = true;

        const nextUrl = this._getNextPageUrl();
        if (!nextUrl) {
            this._hasMore = false;
            this._showEnd();
            this._loading = false;
            return;
        }

        // Show loading indicator
        if (this._mode === MODE_LOAD_MORE && this._loadMoreBtnEl) {
            this._loadMoreBtnEl.disabled = true;
            this._loadMoreBtnEl.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i>Loading...';
        } else {
            this._spinnerEl && this._spinnerEl.classList.remove('d-none');
        }

        try {
            // Fetch the next page HTML
            const response = await fetch(nextUrl, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) throw new Error('Failed to fetch');

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract product items from the next page's grid
            const newGrid = doc.querySelector('#o_wsale_products_grid');
            const newPager = doc.querySelector('.products_pager');

            if (newGrid) {
                // Append the product items (oe_product divs) from new grid to current grid
                const newProducts = newGrid.querySelectorAll('.oe_product');
                newProducts.forEach((product) => {
                    this._gridEl.appendChild(product);
                });
            }

            // Update pager reference for next page detection
            if (newPager && this._pagerEl) {
                this._pagerEl.innerHTML = newPager.innerHTML;
            }

            this._hasMore = this._detectHasMore();
            this._currentPage++;

            if (!this._hasMore) {
                this._showEnd();
            } else if (this._mode === MODE_LOAD_MORE && this._loadMoreBtnEl) {
                this._loadMoreBtnEl.disabled = false;
                this._loadMoreBtnEl.innerHTML = '<i class="fa fa-arrow-down me-1"></i>Load More Products';
            }
        } catch (e) {
            // On error, restore load more button
            if (this._mode === MODE_LOAD_MORE && this._loadMoreBtnEl) {
                this._loadMoreBtnEl.disabled = false;
                this._loadMoreBtnEl.innerHTML = '<i class="fa fa-arrow-down me-1"></i>Load More Products';
            }
        } finally {
            this._loading = false;
            if (this._mode === MODE_INFINITE) {
                this._spinnerEl && this._spinnerEl.classList.add('d-none');
            }
        }
    },

    /**
     * @private
     */
    _showEnd: function () {
        this._spinnerEl && this._spinnerEl.classList.add('d-none');
        this._loadMoreBtnEl && this._loadMoreBtnEl.classList.add('d-none');
        this._endEl && this._endEl.classList.remove('d-none');
        if (this._observer) {
            this._observer.disconnect();
        }
    },
});
