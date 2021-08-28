from django.core.management.base import BaseCommand
from django.db.models import Sum

from cardpicker.models import Card, Cardback, Token


class Command(BaseCommand):
    help = "Returns the total size of all images in the database"

    def handle(self, *args, **kwargs):
        # store as GB
        card_size = round(Card.objects.aggregate(Sum("size"))["size__sum"] / 1000000000)
        cardback_size = round(
            Cardback.objects.aggregate(Sum("size"))["size__sum"] / 1000000000
        )
        token_size = round(
            Token.objects.aggregate(Sum("size"))["size__sum"] / 1000000000
        )
        print(
            f"Total size: {(card_size + cardback_size + token_size)/1000} TB - cardbacks: {card_size} GB, tokens: {cardback_size} GB, tokens: {token_size} GB"
        )
