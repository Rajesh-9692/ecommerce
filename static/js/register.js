document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("registerForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value;

        const password =
            document.getElementById("password").value;

        try {

            const response = await fetch(
                API_BASE_URL + "/users/register/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    JSON.stringify(data)
                );
            }

            alert(
                "Registration successful! Please login."
            );

            window.location.href = "/login/";

        } catch (error) {

            const errorBox =
                document.getElementById("registerError");

            if (errorBox) {

                errorBox.textContent =
                    error.message;

                errorBox.style.display =
                    "block";

            } else {

                alert(error.message);

            }

        }

    });

});