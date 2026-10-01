document.addEventListener("DOMContentLoaded", function () {

    const searchForm = document.getElementById("navSearchForm");

    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const query = document.getElementById("navSearchInput").value.trim();
            window.location.href = "/products/?search=" + encodeURIComponent(query);
        });
    }

    const authLink = document.getElementById("authLink");

    if (!authLink) {
        return;
    }

    const token = localStorage.getItem("access_token");

    if (token) {

        authLink.textContent = "Logout";
        authLink.href = "#";

        authLink.addEventListener("click", function (event) {
            event.preventDefault();

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href = "/login/";
        });

    } else {

        authLink.textContent = "Login";
        authLink.href = "/login/";

    }

});