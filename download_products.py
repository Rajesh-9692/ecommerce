from datasets import load_dataset
from PIL import Image
from pathlib import Path
import csv
import io



TARGET_PRODUCTS = 10000

OUTPUT_CSV = Path("shopify_products_10000.csv")
IMAGE_DIR = Path("shopify_product_images")

IMAGE_DIR.mkdir(parents=True, exist_ok=True)


print("Starting Shopify product dataset...")

dataset = load_dataset(
    "Shopify/product-catalogue",
    split="train",
    streaming=True,
)

# Keep only the fields we need.
required_columns = {
    "product_title",
    "product_description",
    "product_image",
    "ground_truth_brand",
    "ground_truth_category",
}

columns_to_remove = [
    column
    for column in dataset.column_names
    if column not in required_columns
]

dataset = dataset.remove_columns(columns_to_remove)



with open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
) as csv_file:

    writer = csv.writer(csv_file)

    writer.writerow([
        "name",
        "description",
        "brand",
        "category",
        "image"
    ])


    for i, item in enumerate(dataset, start=1):

        try:
            name = (
                item.get("product_title")
                or "Unknown Product"
            )

            description = (
                item.get("product_description")
                or ""
            )

            brand = (
                item.get("ground_truth_brand")
                or "Unknown"
            )

            category = (
                item.get("ground_truth_category")
                or "Other"
            )

            image_data = item.get("product_image")

            image_filename = ""

            if image_data is not None:

                image = None

                # Case 1: Hugging Face returns a PIL image
                if isinstance(image_data, Image.Image):

                    image = image_data

                # Case 2: Hugging Face returns bytes
                elif isinstance(image_data, dict):

                    image_bytes = image_data.get("bytes")

                    image_path = image_data.get("path")

                    if image_bytes:
                        image = Image.open(
                            io.BytesIO(image_bytes)
                        )

                    elif image_path:
                        image = Image.open(image_path)

                if image is not None:

                    # Convert to RGB for JPG
                    if image.mode != "RGB":
                        image = image.convert("RGB")

                    image_filename = (
                        f"product_{i}.jpg"
                    )

                    image.save(
                        IMAGE_DIR / image_filename,
                        "JPEG",
                        quality=90
                    )

            writer.writerow([
                name,
                description,
                brand,
                category,
                image_filename
            ])


            if i % 100 == 0:
                print(
                    f"Collected {i}/{TARGET_PRODUCTS} products..."
                )

            if i >= TARGET_PRODUCTS:
                break

        except Exception as error:

            print(
                f"Skipping product {i} because of error: "
                f"{error}"
            )

            continue

print()
print("==============================================")
print("Download completed!")
print(f"Products: {TARGET_PRODUCTS}")
print(f"CSV: {OUTPUT_CSV}")
print(f"Images: {IMAGE_DIR}")
print("==============================================")