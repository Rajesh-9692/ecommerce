document.addEventListener("DOMContentLoaded", function () {

    const productContainer =
        document.getElementById("productsContainer");

    const searchInput =
        document.getElementById("searchInput");

    const searchButton =
        document.getElementById("searchBtn");

    if (!productContainer) {
        return;
    }

    let loading = false;
    let hasMoreProducts = true;

    let currentSearch = "";
    let currentCategory = "";

    let nextUrl = null;


    const loader = document.createElement("div");

    loader.id = "productLoader";
    loader.className = "col-12 text-center py-4";

    loader.innerHTML = `
        <p class="text-muted">
            Loading products...
        </p>
    `;

    loader.style.display = "none";

    productContainer.appendChild(loader);


    const endMessage = document.createElement("div");

    endMessage.id = "productEndMessage";
    endMessage.className = "col-12 text-center py-4";

    endMessage.innerHTML = `
        <p class="text-muted">
            You have reached the end of the products.
        </p>
    `;

    endMessage.style.display = "none";

    productContainer.appendChild(endMessage);


    function buildApiUrl(page = 1) {

        const params = new URLSearchParams();

        params.set("page", page);
        params.set("page_size", 40);

        if (currentSearch) {
            params.set(
                "search",
                currentSearch
            );
        }

        if (currentCategory) {
            params.set(
                "category",
                currentCategory
            );
        }

        return (
            "/products/api/products/?" +
            params.toString()
        );
    }


    function createProductCard(product) {

        const image = product.image
            ? product.image
            : "https://via.placeholder.com/300x220?text=No+Image";

        const col =
            document.createElement("div");

        col.className = "col";

        col.innerHTML = `
            <div class="product-card h-100">

                <img
                    src="${image}"
                    alt="${product.name}"
                    class="product-image"
                    loading="lazy"
                    decoding="async"
                >

                <div class="product-info">

                    <h3>
                        ${product.name}
                    </h3>

                    <p class="product-brand">
                        Brand:
                        ${product.brand || "N/A"}
                    </p>

                    <p class="product-description">
                        ${product.description || ""}
                    </p>

                    <p class="product-price">
                        ₹${product.price}
                    </p>

                    <a
                        href="/product-details/?id=${product.id}"
                        class="btn btn-primary"
                    >
                        View Details
                    </a>

                </div>

            </div>
        `;

        return col;
    }


    async function loadProducts() {

        if (
            loading ||
            !hasMoreProducts ||
            !nextUrl
        ) {
            return;
        }

        loading = true;

        loader.style.display = "block";

        console.log(
            "Loading:",
            nextUrl
        );

        try {

            const response =
                await apiRequest(nextUrl);

            console.log(
                "Products response:",
                response
            );

            const products =
                Array.isArray(response)
                    ? response
                    : response.results;


            if (
                !products ||
                products.length === 0
            ) {

                hasMoreProducts = false;
                nextUrl = null;

                loader.style.display = "none";

                endMessage.innerHTML = `
                    <p class="text-muted">
                        No products found.
                    </p>
                `;

                endMessage.style.display =
                    "block";

                return;
            }


            products.forEach(function (product) {

                const card =
                    createProductCard(product);

                productContainer.insertBefore(
                    card,
                    loader
                );

            });


            if (response.next) {

                const next =
                    new URL(
                        response.next,
                        window.location.origin
                    );

                nextUrl =
                    next.pathname +
                    next.search;

                console.log(
                    "Next page:",
                    nextUrl
                );

            } else {

                nextUrl = null;
                hasMoreProducts = false;

                loader.style.display = "none";

                endMessage.innerHTML = `
                    <p class="text-muted">
                        You have reached the end of the products.
                    </p>
                `;

                endMessage.style.display =
                    "block";
            }


        } catch (error) {

            console.error(
                "Product loading error:",
                error
            );

            loader.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load products.
                    <br>

                    <button
                        id="retryProducts"
                        class="btn btn-primary mt-2"
                    >
                        Retry
                    </button>
                </div>
            `;

            const retryButton =
                document.getElementById(
                    "retryProducts"
                );

            if (retryButton) {

                retryButton.onclick = function () {

                    loader.innerHTML = `
                        <p class="text-muted">
                            Loading products...
                        </p>
                    `;

                    loadProducts();
                };
            }

        } finally {

            loading = false;
        }
    }


    function startProductLoading() {

        loading = false;
        hasMoreProducts = true;

        nextUrl = buildApiUrl(1);

        productContainer.innerHTML = "";

        productContainer.appendChild(loader);
        productContainer.appendChild(endMessage);

        loader.style.display = "none";
        endMessage.style.display = "none";

        loadProducts();
    }


    function performSearch() {

        currentSearch =
            searchInput
                ? searchInput.value.trim()
                : "";

        startProductLoading();
    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );
    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch();
                }
            }
        );
    }


    window.addEventListener(
        "scroll",
        function () {

            const scrollPosition =
                window.innerHeight +
                window.scrollY;

            const documentHeight =
                document.documentElement.scrollHeight;

            if (
                scrollPosition >=
                documentHeight - 1000
            ) {

                loadProducts();
            }
        }
    );


    currentSearch = "";

    startProductLoading();

});