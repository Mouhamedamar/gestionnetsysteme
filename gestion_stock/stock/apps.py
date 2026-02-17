from django.apps import AppConfig


class StockConfig(AppConfig):
    name = 'stock'

    def ready(self):
        import stock.signals  # noqa: F401
