document.addEventListener("DOMContentLoaded", function () {

    const categoryButtons =
        document.querySelectorAll(".category-button");

    const section =
        document.getElementById(
            "selectedCategorySection"
        );

    const title =
        document.getElementById(
            "selectedCategoryTitle"
        );

    const productsContainer =
        document.getElementById(
            "categoryProductsContainer"
        );

    const loader =
        document.getElementById(
            "categoryLoader"
        );

    const endMessage =
        document.getElementById(
            "categoryEndMessage"
        );

    const clearButton =
        document.getElementById(
            "clearCategoryButton"
        );


    let nextUrl = null;

    let loading = false;

    let hasMore = false;


    // --------------------------------------------------
    // Product card
    // --------------------------------------------------

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


    // --------------------------------------------------
    // Load category products
    // --------------------------------------------------

    async function loadCategoryProducts() {

        if (
            loading ||
            !hasMore ||
            !nextUrl
        ) {
            return;
        }

        loading = true;

        loader.style.display = "block";

        try {

            console.log(
                "Loading category products:",
                nextUrl
            );

            const response =
                await apiRequest(nextUrl);

            const products =
                Array.isArray(response)
                    ? response
                    : response.results;


            if (
                !products ||
                products.length === 0
            ) {

                hasMore = false;
                nextUrl = null;

                loader.style.display = "none";

                endMessage.style.display =
                    "block";

                return;
            }


            products.forEach(
                function (product) {

                    productsContainer.appendChild(
                        createProductCard(product)
                    );

                }
            );


            if (
                response.next
            ) {

                const next =
                    new URL(
                        response.next,
                        window.location.origin
                    );

                nextUrl =
                    next.pathname +
                    next.search;

                hasMore = true;

            } else {

                nextUrl = null;
                hasMore = false;

                loader.style.display =
                    "none";

                endMessage.style.display =
                    "block";
            }


        } catch (error) {

            console.error(
                "Category product error:",
                error
            );

        } finally {

            loading = false;
        }
    }


    // --------------------------------------------------
    // Select category
    // --------------------------------------------------

    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const category =
                        button.dataset.category;

                    section.style.display =
                        "block";

                    title.textContent =
                        category;

                    productsContainer.innerHTML =
                        "";

                    loader.style.display =
                        "none";

                    endMessage.style.display =
                        "none";


                    nextUrl =
                        "/products/api/products/" +
                        "?page=1&page_size=40" +
                        "&category=" +
                        encodeURIComponent(
                            category
                        );

                    loading = false;

                    hasMore = true;


                    loadCategoryProducts();


                    section.scrollIntoView({
                        behavior: "smooth"
                    });

                }
            );

        }
    );


    // --------------------------------------------------
    // Infinite scroll for category
    // --------------------------------------------------

    window.addEventListener(
        "scroll",
        function () {

            if (!hasMore) {
                return;
            }

            const scrollPosition =
                window.innerHeight +
                window.scrollY;

            const documentHeight =
                document.documentElement
                    .scrollHeight;

            if (
                scrollPosition >=
                documentHeight - 1000
            ) {

                loadCategoryProducts();
            }

        }
    );


    // --------------------------------------------------
    // Clear category
    // --------------------------------------------------

    clearButton.addEventListener(
        "click",
        function () {

            section.style.display =
                "none";

            productsContainer.innerHTML =
                "";

            nextUrl = null;

            hasMore = false;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

});