document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.innerHTML = "";

        try {

            const response = await fetch(
                API_BASE_URL + "/users/api/login/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (response.ok) {

                // Save JWT tokens
                saveTokens(data);

                loginMessage.innerHTML =
                    '<div class="alert alert-success">Login successful!</div>';

                // Go to home page
                setTimeout(function () {
                    window.location.href = "/";
                }, 500);

            } else {

                loginMessage.innerHTML =
                    '<div class="alert alert-danger">' +
                    (data.detail || JSON.stringify(data)) +
                    '</div>';
            }

        } catch (error) {

            console.error("Login error:", error);

            loginMessage.innerHTML =
                '<div class="alert alert-danger">' +
                "Unable to connect to the server." +
                '</div>';
        }

    });

});