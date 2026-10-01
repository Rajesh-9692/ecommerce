document.addEventListener("DOMContentLoaded", async function () {

    const popularContainer =
        document.getElementById("popularProducts");

    if (popularContainer) {
        try {
            const response = await apiRequest("/products/api/products/?page=1&page_size=4");
            const products = Array.isArray(response) ? response : response.results;

            if (!products || products.length === 0) {
                popularContainer.innerHTML = `
                    <div class="col-12"><div class="state-message">No products are available right now.</div></div>
                `;
            } else {
                popularContainer.innerHTML = products.map(product => {
                    const image = product.image || "https://via.placeholder.com/300x220?text=No+Image";
                    return `
                        <div class="col">
                            <article class="product-card h-100">
                                <a class="product-image-link" href="/product-details/?id=${product.id}" aria-label="View ${product.name}">
                                    <img src="${image}" alt="${product.name}" class="product-image" loading="lazy" decoding="async">
                                </a>
                                <div class="product-info">
                                    <p class="product-brand">${product.brand || "Everyday edit"}</p>
                                    <h3>${product.name}</h3>
                                    <p class="product-description">${product.description || ""}</p>
                                    <div class="product-card-bottom"><p class="product-price">₹${product.price}</p><a href="/product-details/?id=${product.id}" class="product-arrow" aria-label="View details for ${product.name}">↗</a></div>
                                </div>
                            </article>
                        </div>
                    `;
                }).join("");
            }
        } catch (error) {
            popularContainer.innerHTML = `
                <div class="col-12"><div class="state-message">We couldn't load products just now. Please try the shop.</div></div>
            `;
        }
    }

    const recommendedContainer =
        document.getElementById("recommended");

    if (!recommendedContainer) {
        return;
    }

    const token = getAccessToken();

    if (!token) {
        recommendedContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">
                    Login to see personalized recommendations.
                </p>
                <a href="/login/" class="btn btn-primary">
                    Login
                </a>
            </div>
        `;

        return;
    }

    try {

        const recommendations =
            await apiRequest("/recommendations/");

        if (!recommendations ||
            recommendations.length === 0) {

            recommendedContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">
                        No recommendations available yet.
                        Browse some products to get recommendations.
                    </p>
                </div>
            `;

            return;
        }

        recommendedContainer.innerHTML =
            recommendations.map(product => {

                const image = product.image
                    ? product.image
                    : "https://via.placeholder.com/300x220?text=No+Image";

                return `
                    <div class="col">
                        <div class="product-card h-100">

                            <img
                                src="${image}"
                                alt="${product.name}"
                                class="product-image"
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
                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );

        recommendedContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    Unable to load recommendations.
                </div>
            </div>
        `;
    }
});