{
    'name': 'eCommerce Infinite Scroll',
    'version': '19.0.1.0.0',
    'category': 'Website/Website',
    'summary': 'Replace shop pagination with infinite scroll or a Load More button.',
    'description': """
        eCommerce Infinite Scroll
        ==========================
        Replaces the default Odoo shop pagination with a modern infinite scroll
        or a "Load More" button experience — standard on all major eCommerce sites.

        Features:
        - Infinite scroll mode: products load automatically as user scrolls down
        - Load More mode: explicit button at the bottom for user control
        - Bootstrap spinner shown while loading
        - "All products loaded" end indicator
        - Fully compatible with filters, categories, and sorting
        - Uses IntersectionObserver API — no polling, battery-friendly
        - Fetches next page via standard Odoo shop URLs (no extra backend logic)
        - Switch modes via body data attribute
    """,
    'author': 'Veloxio',
    'website': 'mailto:piyush23321@gmail.com',
    'depends': ['website_sale'],
    'data': [
        'views/templates.xml',
        'views/res_config_settings_views.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'website_sale_infinite_scrolling/static/src/scss/infinite_scroll.scss',
            'website_sale_infinite_scrolling/static/src/interactions/infinite_scroll.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
    'price': 0.0,
    'currency': 'EUR',
}
