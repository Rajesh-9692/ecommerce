document.addEventListener("DOMContentLoaded", async function () {

    const container =
        document.getElementById("productDetails");

    if (!container) {
        return;
    }

    const params = new URLSearchParams(
        window.location.search
    );

    const productId = params.get("id");

    if (!productId) {

        container.innerHTML = `
            <div class="alert alert-danger">
                Product ID not found.
            </div>
        `;

        return;
    }

    try {

        const product = await getProduct(productId);

        const image = product.image
            ? product.image
            : "https://via.placeholder.com/500x400?text=No+Image";

        container.innerHTML = `

            <div class="product-details">

                <div>
                    <img
                        src="${image}"
                        alt="${product.name}"
                    >
                </div>

                <div class="product-details-info">

                    <h1>${product.name}</h1>

                    <p>
                        <strong>Brand:</strong>
                        ${product.brand || "N/A"}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        ${product.category_name || "N/A"}
                    </p>

                    <p>
                        ${product.description || ""}
                    </p>

                    <div class="price">
                        ₹${product.price}
                    </div>

                    <p>
                        <strong>Stock:</strong>
                        ${product.stock}
                    </p>

                    <div class="mb-3">

                        <input
                            type="number"
                            id="quantity"
                            value="1"
                            min="1"
                            max="${product.stock}"
                            class="form-control"
                            style="max-width:120px;"
                        >

                    </div>

                    <!-- Buttons -->

                    <div class="d-flex gap-2">

                        <button
                            class="btn btn-primary"
                            id="addToCartButton"
                        >
                            Add to Cart
                        </button>

                        <button
                            class="btn btn-success"
                            id="buyNowButton"
                        >
                            Buy Now
                        </button>

                    </div>

                </div>

            </div>
        `;


        /* ================================
           ADD TO CART
        ================================ */

        document
            .getElementById("addToCartButton")
            .addEventListener("click", async function () {

                const token = getAccessToken();

                if (!token) {

                    alert("Please login first.");

                    window.location.href = "/login/";

                    return;
                }

                const quantity =
                    parseInt(
                        document.getElementById("quantity").value
                    );

                if (
                    !quantity ||
                    quantity < 1 ||
                    quantity > product.stock
                ) {

                    alert("Please enter a valid quantity.");

                    return;
                }

                try {

                    await addToCart(
                        product.id,
                        quantity
                    );

                    alert("Product added to cart.");

                } catch (error) {

                    alert(error.message);

                }

            });


        /* ================================
           BUY NOW
        ================================ */

        document
            .getElementById("buyNowButton")
            .addEventListener("click", async function () {

                const token = getAccessToken();

                if (!token) {

                    alert("Please login first.");

                    window.location.href = "/login/";

                    return;
                }

                const quantity =
                    parseInt(
                        document.getElementById("quantity").value
                    );

                if (
                    !quantity ||
                    quantity < 1 ||
                    quantity > product.stock
                ) {

                    alert("Please enter a valid quantity.");

                    return;
                }

                try {

                    await addToCart(
                        product.id,
                        quantity
                    );

                    window.location.href = "/checkout/";

                } catch (error) {

                    alert(error.message);

                }

            });


    } catch (error) {

        container.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }

});