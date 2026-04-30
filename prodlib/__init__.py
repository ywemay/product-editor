"""prodlib - Python implementation of the .prod binary file format v2.

Lightweight version for the Desktop Editor (no company/deal support).
"""

from .core import Product, Header
from .store import open_product, get_price_history, add_price, add_photo, remove_photo
