from odoo import http
from odoo.http import request


class InfiniteScrollController(http.Controller):

    @http.route('/shop/products/load_more', type='json', auth='public', website=True)
    def load_more(self, page=1, search='', category=0, attrib=None, order=None, **kwargs):
        """Return HTML for the next page of products to append to the grid."""
        attrib = attrib or []

        # Re-use the website_sale shop search logic
        WebsiteSale = request.env['ir.ui.view'].sudo()

        # Build query params to pass to the shop controller
        params = {'page': page}
        if search:
            params['search'] = search
        if category:
            params['category'] = category
        if attrib:
            params['attrib'] = attrib
        if order:
            params['order'] = order

        # Fetch the shop page and extract just the product grid section
        try:
            response = request.env['website'].browse(request.website.id)._render_template(
                'website_sale.products',
                values={
                    'page': page,
                    'search': search,
                    'category': category and request.env['product.public.category'].browse(int(category)),
                    'attrib_values': attrib,
                    'order': order or 'website_published desc, is_published_related desc, sequence asc, name asc',
                }
            )
        except Exception:
            return {'html': '', 'has_more': False}

        # Parse and return only the grid inner HTML + has_more
        from lxml import html as lxml_html
        try:
            doc = lxml_html.fromstring(response)
            grid = doc.find('.//*[@id="o_wsale_products_grid"]')
            pager = doc.find('.//*[@id="o_wsale_pager"]')
            grid_html = lxml_html.tostring(grid, encoding='unicode') if grid is not None else ''
            # Check if there are more pages by looking at pager "next" link
            has_more = False
            if pager is not None:
                has_more = bool(pager.find('.//*[@aria-label="Next"]') or
                               pager.find('.//*[contains(@class,"o_next")]'))
        except Exception:
            return {'html': '', 'has_more': False}

        return {'html': grid_html, 'has_more': has_more}
