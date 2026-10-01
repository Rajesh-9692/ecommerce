document.addEventListener("DOMContentLoaded", async function () {

    const container =
        document.getElementById("cartContainer");

    if (!container) {
        return;
    }

    const token = getAccessToken();

    if (!token) {

        container.innerHTML = `
            <div class="alert alert-danger">
                Please login to view your cart.
            </div>
        `;

        return;
    }

    try {

        const items = await getCartItems();

        container.innerHTML = "";

        if (!items || items.length === 0) {

            container.innerHTML = `
                <div class="text-center">
                    <h3>Your cart is empty.</h3>
                    <a
                        href="/products/"
                        class="btn btn-primary mt-3"
                    >
                        Continue Shopping
                    </a>
                </div>
            `;

            return;
        }

        let total = 0;

        items.forEach(item => {

            const price =
                parseFloat(item.product_price);

            const quantity =
                parseInt(item.quantity);

            const subtotal =
                price * quantity;

            total += subtotal;

            container.innerHTML += `

                <div class="cart-item mb-3 p-3 bg-white rounded">

                    <h4>
                        ${item.product_name}
                    </h4>

                    <p>
                        Price: ₹${item.product_price}
                    </p>

                    <p>
                        Quantity: ${item.quantity}
                    </p>

                    <p>
                        Subtotal: ₹${subtotal.toFixed(2)}
                    </p>

                    <button
                        class="btn btn-danger"
                        onclick="removeCartItem(${item.id})"
                    >
                        Remove
                    </button>

                </div>
            `;
        });

        container.innerHTML += `

            <div class="cart-total">

                Total:
                ₹${total.toFixed(2)}

                <br><br>

                <a
                    href="/checkout/"
                    class="btn btn-success"
                >
                    Checkout
                </a>

            </div>
        `;

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }

});


async function removeCartItem(itemId) {

    try {

        await deleteCartItem(itemId);

        alert("Item removed from cart.");

        location.reload();

    } catch (error) {

        alert(error.message);

    }

}