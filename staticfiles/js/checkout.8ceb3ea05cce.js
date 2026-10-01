document.addEventListener("DOMContentLoaded", async function () {

    const checkoutSummary =
        document.getElementById("checkoutSummary");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const checkoutMessage =
        document.getElementById("checkoutMessage");

    const placeOrderButton =
        document.getElementById("placeOrderButton");


    if (!checkoutSummary || !placeOrderButton) {
        return;
    }


    const token = getAccessToken();

    if (!token) {

        checkoutSummary.innerHTML = `
            <div class="alert alert-danger">
                Please login first.
            </div>
        `;

        placeOrderButton.disabled = true;

        return;
    }


    try {

        const items = await getCartItems();


        if (!items || items.length === 0) {

            checkoutSummary.innerHTML = `
                <div class="alert alert-warning">
                    Your cart is empty.
                </div>
            `;

            checkoutTotal.innerHTML = "";

            placeOrderButton.disabled = true;

            return;
        }


        let total = 0;


        checkoutSummary.innerHTML = items.map(item => {

            const price =
                parseFloat(item.product_price);

            const quantity =
                parseInt(item.quantity);

            const subtotal =
                price * quantity;

            total += subtotal;


            return `
                <div class="d-flex justify-content-between mb-3">

                    <span>
                        ${item.product_name}
                        × ${quantity}
                    </span>

                    <strong>
                        ₹${subtotal.toFixed(2)}
                    </strong>

                </div>
            `;

        }).join("");


        checkoutTotal.innerHTML = `
            <h4>
                Total: ₹${total.toFixed(2)}
            </h4>
        `;


        /* ================================
           PLACE ORDER
        ================================ */

        placeOrderButton.addEventListener(
            "click",
            async function () {

                placeOrderButton.disabled = true;

                placeOrderButton.textContent =
                    "Placing Order...";


                try {

                    await apiRequest(
                        "/orders/api/",
                        {
                            method: "POST",
                            body: JSON.stringify({})
                        }
                    );


                    checkoutMessage.innerHTML = `
                        <div class="alert alert-success">
                            Order placed successfully!
                        </div>
                    `;


                    setTimeout(function () {

                        window.location.href =
                            "/orders/";

                    }, 1000);


                } catch (error) {

                    checkoutMessage.innerHTML = `
                        <div class="alert alert-danger">
                            ${error.message}
                        </div>
                    `;

                    placeOrderButton.disabled = false;

                    placeOrderButton.textContent =
                        "Place Order";

                }

            }
        );


    } catch (error) {

        checkoutSummary.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;

        placeOrderButton.disabled = true;

    }

});