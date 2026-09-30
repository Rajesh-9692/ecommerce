document.addEventListener("DOMContentLoaded", async function () {

    const container =
        document.getElementById("ordersContainer");

    if (!container) {
        return;
    }

    const token = getAccessToken();

    if (!token) {

        container.innerHTML = `
            <div class="alert alert-danger">
                Please login to view your orders.
            </div>
        `;

        return;
    }

    try {

        const orders = await getOrders();

        container.innerHTML = "";

        if (!orders || orders.length === 0) {

            container.innerHTML = `
                <div class="text-center">
                    <h3>No orders found.</h3>
                </div>
            `;

            return;
        }

        orders.forEach(order => {

            let itemsHTML = "";

            order.items.forEach(item => {

                itemsHTML += `
                    <p>
                        ${item.product_name}
                        × ${item.quantity}
                        — ₹${item.price}
                    </p>
                `;
            });

            container.innerHTML += `

                <div class="order-card">

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        Status:
                        <span class="order-status">
                            ${order.status}
                        </span>
                    </p>

                    <p>
                        Total:
                        ₹${order.total_amount}
                    </p>

                    <hr>

                    ${itemsHTML}

                    <small>
                        ${order.created_at}
                    </small>

                </div>
            `;
        });

    } catch (error) {

        container.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }

});