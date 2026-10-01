document.addEventListener("DOMContentLoaded", function () {
    const productContainer = document.getElementById("productsContainer");

    if (!productContainer) {
        return;
    }

    const searchForm = document.getElementById("productsSearchForm");
    const searchInput = document.getElementById("searchInput");
    const clearSearchButton = document.getElementById("clearSearchButton");
    const categoryNavigation = document.getElementById("categoryNavigation");
    const productCount = document.getElementById("productCount");
    const productCountLabel = document.getElementById("productCountLabel");
    const activeFilterLabel = document.getElementById("activeFilterLabel");
    const productLoader = document.getElementById("productLoader");
    const productEndMessage = document.getElementById("productEndMessage");
    const productEmptyState = document.getElementById("productEmptyState");
    const productErrorState = document.getElementById("productErrorState");
    const productsFeedback = document.getElementById("productsFeedback");

    let loading = false;
    let hasMoreProducts = true;
    let loadedCount = 0;
    let totalCount = null;
    let nextUrl = null;
    let requestVersion = 0;
    let categoryNavigationReady = false;
    let currentSearch = new URLSearchParams(window.location.search).get("search") || "";
    let currentCategory = new URLSearchParams(window.location.search).get("category") || "";

    searchInput.value = currentSearch;
    updateClearButton();

    function buildApiUrl(page = 1) {
        const params = new URLSearchParams();
        params.set("page", page);
        params.set("page_size", 40);

        if (currentSearch) {
            params.set("search", currentSearch);
        }

        if (currentCategory) {
            params.set("category", currentCategory);
        }

        return "/products/api/products/?" + params.toString();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatPrice(value) {
        const price = Number(value);

        if (!Number.isFinite(price)) {
            return "Price unavailable";
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(price);
    }

    function createProductCard(product) {
        const item = document.createElement("div");
        item.className = "product-grid-item";

        const name = escapeHTML(product.name || "Product");
        const brand = escapeHTML(product.brand || "");
        const category = escapeHTML((product.category_name || "").split(" > ")[0]);
        const image = product.image
            ? `<img src="${escapeHTML(product.image)}" alt="${name}" class="listing-product-image" loading="lazy" decoding="async">`
            : `<div class="listing-product-placeholder" role="img" aria-label="No image available"><span aria-hidden="true">M</span><small>Image unavailable</small></div>`;
        const inStock = Number(product.stock) > 0;
        const itemLabel = brand || category || "Everyday edit";

        item.innerHTML = `
            <article class="product-card listing-product-card">
                <a class="listing-product-media" href="/product-details/?id=${encodeURIComponent(product.id)}" aria-label="View ${name}">
                    ${image}
                    ${!inStock ? '<span class="listing-stock-badge">Currently unavailable</span>' : ""}
                </a>
                <div class="listing-product-info">
                    <p class="listing-product-brand">${itemLabel}</p>
                    <h2 class="listing-product-name"><a href="/product-details/?id=${encodeURIComponent(product.id)}">${name}</a></h2>
                    <div class="listing-product-meta">
                        <span class="listing-product-category">${category && category !== itemLabel ? category : "Selected for everyday"}</span>
                        <span class="listing-stock-note">${inStock ? "In stock" : "Out of stock"}</span>
                    </div>
                    <p class="listing-product-price">${formatPrice(product.price)}</p>
                    <div class="listing-product-actions">
                        <button class="btn btn-primary listing-add-button" type="button" data-add-to-cart data-product-id="${escapeHTML(product.id)}" data-product-name="${name}" ${!inStock ? "disabled" : ""} aria-label="Add ${name} to cart">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h2l2.1 10.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 1.9-1.5L21 8H6"></path><circle cx="9.5" cy="19.5" r="1"></circle><circle cx="17.5" cy="19.5" r="1"></circle></svg>
                            Add to cart
                        </button>
                        <a class="listing-details-link" href="/product-details/?id=${encodeURIComponent(product.id)}">Details <span aria-hidden="true">&rarr;</span></a>
                    </div>
                </div>
            </article>
        `;

        return item;
    }

    function showSkeletons() {
        productContainer.innerHTML = Array.from({ length: 8 }, () => `
            <div class="product-skeleton" aria-hidden="true">
                <div class="skeleton-image"></div>
                <div class="skeleton-lines"><i></i><b></b><i></i><strong></strong><em></em></div>
            </div>
        `).join("");
    }

    function updateClearButton() {
        clearSearchButton.hidden = !searchInput.value;
    }

    function updateProductCount() {
        if (totalCount !== null) {
            productCount.textContent = totalCount.toLocaleString("en-IN");
        } else {
            productCount.textContent = loadedCount.toLocaleString("en-IN");
        }

        if (totalCount !== null && loadedCount < totalCount) {
            productCountLabel.textContent = `Showing ${loadedCount.toLocaleString("en-IN")} of ${totalCount.toLocaleString("en-IN")} products`;
        } else {
            productCountLabel.textContent = `Showing ${loadedCount.toLocaleString("en-IN")} ${loadedCount === 1 ? "product" : "products"}`;
        }

        const filters = [];
        if (currentSearch) filters.push(`Search: “${currentSearch}”`);
        if (currentCategory) filters.push(currentCategory);
        activeFilterLabel.textContent = filters.join(" · ");
        activeFilterLabel.hidden = filters.length === 0;
    }

    function updateCategoryNavigation(products) {
        if (categoryNavigationReady) {
            return;
        }

        const categoryNames = [...new Set(products
            .map(product => (product.category_name || "").split(" > ")[0].trim())
            .filter(Boolean))].slice(0, 12);

        if (!categoryNames.length) {
            return;
        }

        categoryNavigation.innerHTML = `
            <button class="products-category" type="button" data-category="" aria-pressed="false">All</button>
            ${categoryNames.map(category => `
                <button class="products-category" type="button" data-category="${escapeHTML(category)}" aria-pressed="false">${escapeHTML(category)}</button>
            `).join("")}
        `;
        categoryNavigationReady = true;
        setActiveCategory();
    }

    function setActiveCategory() {
        categoryNavigation.querySelectorAll("[data-category]").forEach(button => {
            const active = button.dataset.category === currentCategory;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    async function loadProducts(version = requestVersion) {
        if (loading || !hasMoreProducts || !nextUrl || version !== requestVersion) {
            return;
        }

        loading = true;
        productContainer.setAttribute("aria-busy", "true");
        if (loadedCount > 0) {
            productLoader.hidden = false;
        }

        try {
            const response = await apiRequest(nextUrl);

            if (version !== requestVersion) {
                return;
            }

            const products = Array.isArray(response)
                ? response
                : (Array.isArray(response.results) ? response.results : []);

            totalCount = Number.isFinite(Number(response.count))
                ? Number(response.count)
                : null;

            if (loadedCount === 0) {
                productContainer.innerHTML = "";
            }

            if (!products.length && loadedCount === 0) {
                productEmptyState.hidden = false;
                productContainer.hidden = true;
                hasMoreProducts = false;
                nextUrl = null;
                updateProductCount();
                return;
            }

            updateCategoryNavigation(products);
            products.forEach(product => productContainer.appendChild(createProductCard(product)));
            loadedCount += products.length;
            updateProductCount();

            if (response.next) {
                const next = new URL(response.next, window.location.origin);
                nextUrl = next.pathname + next.search;
                productEndMessage.hidden = true;
            } else {
                nextUrl = null;
                hasMoreProducts = false;
                productEndMessage.hidden = loadedCount === 0;
            }
        } catch (error) {
            if (version !== requestVersion) {
                return;
            }

            if (loadedCount === 0) {
                productContainer.hidden = true;
                productErrorState.hidden = false;
            } else {
                productsFeedback.textContent = "More products couldn’t be loaded. Please try again.";
                productsFeedback.hidden = false;
            }
            hasMoreProducts = false;
        } finally {
            if (version === requestVersion) {
                loading = false;
                productLoader.hidden = true;
                productContainer.setAttribute("aria-busy", "false");
            }
        }
    }

    function startProductLoading() {
        requestVersion += 1;
        loading = false;
        hasMoreProducts = true;
        loadedCount = 0;
        totalCount = null;
        nextUrl = buildApiUrl(1);

        productContainer.hidden = false;
        productEmptyState.hidden = true;
        productErrorState.hidden = true;
        productEndMessage.hidden = true;
        productLoader.hidden = true;
        productsFeedback.hidden = true;
        productsFeedback.textContent = "";
        productCount.textContent = "—";
        productCountLabel.textContent = "Loading products...";
        showSkeletons();
        loadProducts(requestVersion);
    }

    function performSearch() {
        currentSearch = searchInput.value.trim();
        updateClearButton();
        startProductLoading();
    }

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        performSearch();
    });

    searchInput.addEventListener("input", updateClearButton);

    clearSearchButton.addEventListener("click", function () {
        searchInput.value = "";
        performSearch();
        searchInput.focus();
    });

    categoryNavigation.addEventListener("click", function (event) {
        const button = event.target.closest("[data-category]");
        if (!button) return;

        currentCategory = button.dataset.category;
        setActiveCategory();
        startProductLoading();
    });

    document.getElementById("browseAllButton").addEventListener("click", function () {
        currentSearch = "";
        currentCategory = "";
        searchInput.value = "";
        updateClearButton();
        setActiveCategory();
        startProductLoading();
    });

    document.getElementById("retryProducts").addEventListener("click", startProductLoading);

    productContainer.addEventListener("click", async function (event) {
        const button = event.target.closest("[data-add-to-cart]");
        if (!button) return;

        if (!getAccessToken()) {
            window.location.href = "/login/";
            return;
        }

        button.disabled = true;
        button.classList.add("is-loading");

        try {
            await addToCart(button.dataset.productId, 1);
            productsFeedback.textContent = `${button.dataset.productName} added to your cart.`;
            productsFeedback.hidden = false;
            button.classList.add("is-added");
            button.innerHTML = "Added to cart";
            window.setTimeout(function () {
                button.disabled = false;
                button.classList.remove("is-loading", "is-added");
                button.innerHTML = "Add to cart";
            }, 1600);
        } catch (error) {
            productsFeedback.textContent = "We couldn’t add this product right now. Please try again.";
            productsFeedback.hidden = false;
            button.disabled = false;
            button.classList.remove("is-loading");
        }
    });

    window.addEventListener("scroll", function () {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900) {
            loadProducts();
        }
    }, { passive: true });

    startProductLoading();
});