const API_BASE_URL = "http://127.0.0.1:8000";


function getAccessToken() {
    return localStorage.getItem("access_token");
}


function getRefreshToken() {
    return localStorage.getItem("refresh_token");
}


function saveTokens(data) {

    if (data.access) {
        localStorage.setItem("access_token", data.access);
    }

    if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
    }
}


function logoutUser() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/login/";
}


async function refreshAccessToken() {

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(
            API_BASE_URL + "/users/api/token/refresh/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );

        if (!response.ok) {

            console.log("Refresh token expired or invalid.");

            logoutUser();

            return false;
        }

        const data = await response.json();

        if (data.access) {

            localStorage.setItem(
                "access_token",
                data.access
            );

            return true;
        }

        logoutUser();

        return false;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;
    }
}


async function apiRequest(endpoint, options = {}) {

    let token = getAccessToken();

    let headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    /* Add access token */

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;
    }


    /* First request */

    let response = await fetch(
        API_BASE_URL + endpoint,
        {
            ...options,
            headers: headers
        }
    );


    if (response.status === 401) {

        console.log(
            "Access token expired. Refreshing..."
        );


        const refreshed =
            await refreshAccessToken();


        if (!refreshed) {

            throw new Error(
                "Session expired. Please login again."
            );
        }


        /* Get new access token */

        token = getAccessToken();


        headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };


        if (token) {

            headers["Authorization"] =
                `Bearer ${token}`;
        }


        /* Retry original request */

        response = await fetch(
            API_BASE_URL + endpoint,
            {
                ...options,
                headers: headers
            }
        );
    }


    const contentType =
        response.headers.get("content-type");


    if (
        contentType &&
        contentType.includes("application/json")
    ) {

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                JSON.stringify(data)
            );
        }


        return data;
    }


    const text =
        await response.text();


    if (!response.ok) {

        throw new Error(text);
    }


    return text;
}

async function getProducts() {

    return await apiRequest(
        "/products/api/products/"
    );
}


async function getProduct(productId) {

    return await apiRequest(
        `/products/api/products/${productId}/`
    );
}


async function getCategories() {

    return await apiRequest(
        "/products/api/categories/"
    );
}


async function getCart() {

    return await apiRequest(
        "/cart/api/cart/"
    );
}


async function getCartItems() {

    return await apiRequest(
        "/cart/api/items/"
    );
}


async function addToCart(productId, quantity) {

    return await apiRequest(
        "/cart/api/items/",
        {
            method: "POST",

            body: JSON.stringify({
                product: productId,
                quantity: quantity
            })
        }
    );
}


async function deleteCartItem(itemId) {

    return await apiRequest(
        `/cart/api/items/${itemId}/`,
        {
            method: "DELETE"
        }
    );
}


async function getOrders() {

    return await apiRequest(
        "/orders/api/"
    );
}


async function createOrder() {

    return await apiRequest(
        "/orders/api/",
        {
            method: "POST",

            body: JSON.stringify({})
        }
    );
}


async function getRecommendations() {

    return await apiRequest(
        "/recommendations/"
    );
}