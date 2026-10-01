document.addEventListener("DOMContentLoaded", function () {

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