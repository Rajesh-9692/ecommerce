document.addEventListener("DOMContentLoaded", async function () {
    const dashboard = document.getElementById("profileDashboard");

    if (!dashboard) {
        return;
    }

    const guestState = document.getElementById("profileGuestState");
    const profileMessage = document.getElementById("profileMessage");
    const editButton = document.getElementById("editProfileBtn");
    const editForm = document.getElementById("editProfileForm");
    const editError = document.getElementById("editProfileError");
    const saveButton = document.getElementById("saveProfileBtn");
    let currentProfile = null;
    const logoutButtons = [
        document.getElementById("logoutBtn"),
        document.getElementById("accountLogoutLink")
    ];

    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener("click", logoutUser);
        }
    });

    editButton.addEventListener("click", function () {
        if (!currentProfile) return;

        document.getElementById("editUsername").value = currentProfile.username || "";
        document.getElementById("editEmail").value = currentProfile.email || "";
        editError.hidden = true;
        editForm.hidden = false;
        editButton.hidden = true;
        editButton.setAttribute("aria-expanded", "true");
        document.getElementById("editUsername").focus();
    });

    document.getElementById("cancelProfileEditBtn").addEventListener("click", function () {
        editForm.reset();
        editError.hidden = true;
        editForm.hidden = true;
        editButton.hidden = false;
        editButton.setAttribute("aria-expanded", "false");
    });

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        editError.hidden = true;

        const username = document.getElementById("editUsername").value.trim();
        const email = document.getElementById("editEmail").value.trim();

        if (!username) {
            editError.textContent = "Enter a username to continue.";
            editError.hidden = false;
            document.getElementById("editUsername").focus();
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const updatedProfile = await apiRequest("/users/api/profile/", {
                method: "PATCH",
                body: JSON.stringify({ username, email })
            });

            currentProfile = updatedProfile;
            renderProfile(currentProfile);
            editForm.hidden = true;
            editButton.hidden = false;
            editButton.setAttribute("aria-expanded", "false");
            profileMessage.textContent = "Your profile changes have been saved.";
            profileMessage.hidden = false;
        } catch (error) {
            const message = String(error.message || "").toLowerCase();

            if (message.includes("username")) {
                editError.textContent = "That username is unavailable. Choose another one.";
            } else if (message.includes("email")) {
                editError.textContent = "Enter a valid email address.";
            } else {
                editError.textContent = "We couldn’t save your changes. Please try again.";
            }

            editError.hidden = false;
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save changes";
        }
    });

    if (!getAccessToken()) {
        guestState.hidden = false;
        return;
    }

    dashboard.hidden = false;

    const profileRequest = apiRequest("/users/api/profile/");
    const ordersRequest = getOrders();
    const cartRequest = getCartItems();
    const recommendationsRequest = apiRequest("/recommendations/");

    const [profileResult, ordersResult, cartResult, recommendationsResult] =
        await Promise.allSettled([
            profileRequest,
            ordersRequest,
            cartRequest,
            recommendationsRequest
        ]);

    if (profileResult.status === "fulfilled") {
        currentProfile = profileResult.value;
        renderProfile(currentProfile);
    } else {
        profileMessage.textContent = "We couldn’t load your account details. Please refresh and try again.";
        profileMessage.hidden = false;
        document.getElementById("profileName").textContent = "Account details unavailable";
        document.getElementById("profileEmail").textContent = "Please try again in a moment.";
        document.getElementById("usernameValue").textContent = "Unavailable";
        document.getElementById("emailValue").textContent = "Unavailable";
        document.getElementById("profileAvatar").textContent = "?";
        editButton.disabled = true;
    }

    if (ordersResult.status === "fulfilled") {
        renderOrders(ordersResult.value);
    } else {
        document.getElementById("ordersCount").textContent = "—";
        document.getElementById("recentOrders").innerHTML = `
            <div class="account-inline-state">We couldn’t load recent orders. Visit <a href="/orders/">Your orders</a> to try again.</div>
        `;
    }

    if (cartResult.status === "fulfilled") {
        const cartItems = getCollection(cartResult.value);
        const itemCount = cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
        document.getElementById("cartCount").textContent = itemCount.toLocaleString("en-IN");
    } else {
        document.getElementById("cartCount").textContent = "—";
    }

    if (recommendationsResult.status === "fulfilled") {
        const recommendations = getCollection(recommendationsResult.value);
        document.getElementById("recommendationsCount").textContent = recommendations.length.toLocaleString("en-IN");
        document.getElementById("recommendationsMessage").textContent = recommendations.length
            ? `${recommendations.length} personalized ${recommendations.length === 1 ? "pick is" : "picks are"} ready to explore.`
            : "No recommendations yet. Explore a few products to get started.";
    } else {
        document.getElementById("recommendationsCount").textContent = "—";
        document.getElementById("recommendationsMessage").textContent = "Recommendations are unavailable right now. Browse the shop and check back soon.";
    }

    dashboard.setAttribute("aria-busy", "false");
});

function renderProfile(profile) {
    const username = profile.username || "My account";
    const email = profile.email || "Not provided";
    const initials = username.trim().slice(0, 2).toUpperCase() || "M";

    document.getElementById("profileName").textContent = username;
    document.getElementById("profileEmail").textContent = email;
    document.getElementById("profileAvatar").textContent = initials;
    document.getElementById("usernameValue").textContent = username;
    document.getElementById("emailValue").textContent = email;
}

function getCollection(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.results)) {
        return response.results;
    }

    return [];
}

function renderOrders(response) {
    const orders = getCollection(response);
    const container = document.getElementById("recentOrders");

    document.getElementById("ordersCount").textContent = orders.length.toLocaleString("en-IN");

    if (!orders.length) {
        container.innerHTML = `
            <div class="account-empty account-orders-empty">
                <span class="account-empty-icon" aria-hidden="true">&#8599;</span>
                <div>
                    <h3>No orders yet</h3>
                    <p>Start exploring products and your orders will appear here.</p>
                </div>
                <a class="btn btn-primary" href="/products/">Explore products</a>
            </div>
        `;
        return;
    }

    const recentOrders = [...orders]
        .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
        .slice(0, 3);

    container.innerHTML = recentOrders.map(order => {
        const orderId = escapeHTML(order.id ?? "—");
        const date = formatOrderDate(order.created_at);
        const total = formatOrderTotal(order.total_amount);
        const status = String(order.status || "Status unavailable");
        const statusClass = `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        return `
            <article class="account-order-row">
                <div class="account-order-main">
                    <span class="account-order-id">Order #${orderId}</span>
                    <span class="account-order-date">${escapeHTML(date)}</span>
                </div>
                <span class="account-order-total">${escapeHTML(total)}</span>
                <span class="account-order-status ${escapeHTML(statusClass)}">${escapeHTML(status)}</span>
                <a class="account-order-link" href="/orders/" aria-label="View order ${orderId}">View order <span aria-hidden="true">&rarr;</span></a>
            </article>
        `;
    }).join("");
}

function formatOrderDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
}

function formatOrderTotal(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "Total unavailable";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}