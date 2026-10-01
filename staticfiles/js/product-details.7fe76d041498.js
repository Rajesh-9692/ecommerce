document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById("productDetails");

    if (!container) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        showProductError(container, "This product could not be found.");
        return;
    }

    try {
        const product = await getProduct(productId);
        renderProduct(product, container);
        container.setAttribute("aria-busy", "false");
        loadRelatedProducts(product);
    } catch (error) {
        showProductError(container, "We couldn’t load this product. Please return to the shop and try again.");
    }
});

function escapeProductHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatProductPrice(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "Price unavailable";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function showProductError(container, message) {
    container.setAttribute("aria-busy", "false");
    container.innerHTML = `
        <div class="detail-error" role="alert">
            <h1>Product unavailable</h1>
            <p>${escapeProductHTML(message)}</p>
            <a class="btn btn-primary" href="/products/">Back to products</a>
        </div>
    `;
}

function renderProduct(product, container) {
    const name = escapeProductHTML(product.name || "Product");
    const brand = escapeProductHTML(product.brand || "Brand not provided");
    const category = escapeProductHTML(product.category_name || "Category not provided");
    const description = escapeProductHTML(product.description || "Product details are not available.");
    const stock = Number(product.stock) || 0;
    const hasStock = stock > 0;
    const image = product.image
        ? `<img class="detail-product-image" src="${escapeProductHTML(product.image)}" alt="${name}" fetchpriority="high">`
        : `<div class="detail-product-placeholder" role="img" aria-label="No image available"><span aria-hidden="true">M</span><small>Image unavailable</small></div>`;

    container.innerHTML = `
        <div class="product-details detail-product-layout">
            <div class="detail-gallery">
                <div class="detail-image-panel">
                    ${image}
                    <span class="detail-image-index">PRODUCT VIEW</span>
                </div>
            </div>
            <div class="product-details-info detail-product-info">
                <p class="detail-brand">${brand}</p>
                <h1>${name}</h1>
                <p class="detail-category">${category}</p>
                <div class="detail-price-line">
                    <span class="price">${formatProductPrice(product.price)}</span>
                    <span class="detail-stock ${hasStock ? "is-in-stock" : "is-out-of-stock"}">${hasStock ? "In stock" : "Currently unavailable"}</span>
                </div>
                <p class="detail-description">${description}</p>

                <dl class="detail-facts">
                    <div><dt>Brand</dt><dd>${brand}</dd></div>
                    <div><dt>Category</dt><dd>${category}</dd></div>
                    <div><dt>Availability</dt><dd>${hasStock ? `${stock} available` : "Out of stock"}</dd></div>
                </dl>

                <label class="detail-quantity-label" for="quantity">Quantity</label>
                <input type="number" id="quantity" value="1" min="1" max="${stock}" class="form-control detail-quantity" ${!hasStock ? "disabled" : ""}>
                <div class="detail-actions">
                    <button class="btn btn-primary" id="addToCartButton" type="button" ${!hasStock ? "disabled" : ""}>Add to cart</button>
                    <button class="btn btn-success" id="buyNowButton" type="button" ${!hasStock ? "disabled" : ""}>Buy now</button>
                </div>
                <p class="detail-feedback" id="detailFeedback" role="status" aria-live="polite" hidden></p>
            </div>
        </div>
        <section class="detail-information-panel" aria-labelledby="detailInformationTitle">
            <p class="products-eyebrow">THE DETAILS</p>
            <h2 id="detailInformationTitle">Product information</h2>
            <p>${description}</p>
        </section>
    `;

    document.getElementById("addToCartButton").addEventListener("click", function () {
        addProductToCart(product, false);
    });

    document.getElementById("buyNowButton").addEventListener("click", function () {
        addProductToCart(product, true);
    });
}

async function addProductToCart(product, buyNow) {
    if (!getAccessToken()) {
        window.location.href = "/login/";
        return;
    }

    const quantityInput = document.getElementById("quantity");
    const quantity = Number.parseInt(quantityInput.value, 10);
    const stock = Number(product.stock) || 0;
    const feedback = document.getElementById("detailFeedback");

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
        feedback.textContent = "Choose a quantity available in stock.";
        feedback.hidden = false;
        quantityInput.focus();
        return;
    }

    const buttons = [
        document.getElementById("addToCartButton"),
        document.getElementById("buyNowButton")
    ];
    buttons.forEach(button => { button.disabled = true; });

    try {
        await addToCart(product.id, quantity);
        if (buyNow) {
            window.location.href = "/checkout/";
            return;
        }

        feedback.textContent = "Added to your cart.";
        feedback.hidden = false;
        buttons.forEach(button => { button.disabled = stock <= 0; });
    } catch (error) {
        feedback.textContent = "We couldn’t add this product right now. Please try again.";
        feedback.hidden = false;
        buttons.forEach(button => { button.disabled = stock <= 0; });
    }
}

async function loadRelatedProducts(product) {
    const section = document.getElementById("relatedProductsSection");
    const container = document.getElementById("relatedProducts");
    const category = (product.category_name || "").split(" > ")[0].trim();

    if (!category) {
        return;
    }

    try {
        const response = await apiRequest(
            "/products/api/products/?page=1&page_size=8&category=" + encodeURIComponent(category)
        );
        const products = Array.isArray(response)
            ? response
            : (Array.isArray(response.results) ? response.results : []);
        const related = products.filter(item => String(item.id) !== String(product.id)).slice(0, 4);

        if (!related.length) {
            return;
        }

        container.innerHTML = related.map(item => {
            const name = escapeProductHTML(item.name || "Product");
            const brand = escapeProductHTML(item.brand || "");
            const image = item.image
                ? `<img src="${escapeProductHTML(item.image)}" alt="${name}" loading="lazy" decoding="async">`
                : `<div class="related-product-placeholder" aria-hidden="true">M</div>`;

            return `
                <article class="related-product-card">
                    <a class="related-product-image" href="/product-details/?id=${encodeURIComponent(item.id)}" aria-label="View ${name}">${image}</a>
                    <div class="related-product-copy">
                        <p>${brand}</p>
                        <h3><a href="/product-details/?id=${encodeURIComponent(item.id)}">${name}</a></h3>
                        <strong>${formatProductPrice(item.price)}</strong>
                    </div>
                </article>
            `;
        }).join("");
        section.hidden = false;
    } catch (error) {
        section.hidden = true;
    }
}