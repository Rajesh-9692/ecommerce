document.addEventListener("DOMContentLoaded", async function () {

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