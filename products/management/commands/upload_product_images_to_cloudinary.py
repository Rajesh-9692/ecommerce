from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from products.models import Product


class Command(BaseCommand):
    help = "Upload locally stored product images to Cloudinary."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report images that would be uploaded without changing anything.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Process at most this many products.",
        )

    def handle(self, *args, **options):
        if not settings.CLOUDINARY_ENABLED:
            raise CommandError("Cloudinary credentials are not configured.")

        scanned = 0
        uploaded = 0
        skipped = 0
        missing = 0
        failed = 0

        products = Product.objects.exclude(image="").order_by("id").iterator(
            chunk_size=100
        )

        for product in products:
            if options["limit"] and scanned >= options["limit"]:
                break

            scanned += 1
            current_name = product.image.name

            if current_name.startswith("media/products/"):
                skipped += 1
                continue

            source_path = Path(settings.MEDIA_ROOT) / current_name
            if not source_path.is_file():
                missing += 1
                self.stderr.write(
                    f"Missing local file for product {product.pk}: {current_name}"
                )
                continue

            if options["dry_run"]:
                uploaded += 1
                continue

            try:
                with source_path.open("rb") as image_file:
                    product.image.save(
                        source_path.name,
                        File(image_file),
                        save=True,
                    )
                uploaded += 1
            except Exception as error:
                failed += 1
                self.stderr.write(
                    f"Upload failed for product {product.pk}: {type(error).__name__}"
                )

            if scanned % 100 == 0:
                self.stdout.write(
                    f"Scanned {scanned}; uploaded {uploaded}; skipped {skipped}; "
                    f"missing {missing}; failed {failed}."
                )

        action = "Would upload" if options["dry_run"] else "Uploaded"
        self.stdout.write(
            f"{action} {uploaded}; skipped {skipped}; missing {missing}; "
            f"failed {failed}."
        )

        if failed:
            raise CommandError("Some product images could not be uploaded.")