document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("registerForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const messageBox =
            document.getElementById("registerMessage");

        messageBox.className = "mb-3";
        messageBox.textContent = "";

        try {

            const response = await fetch(
                API_BASE_URL + "/users/api/register/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const validationMessage = data.username
                    ? "That username is unavailable. Choose another one."
                    : data.email
                        ? "Enter a valid email address."
                        : "We couldn’t create your account. Check your details and try again.";
                throw new Error(validationMessage);
            }

            messageBox.className = "alert alert-success mb-3";
            messageBox.textContent = "Account created. You can now sign in.";

            window.setTimeout(function () {
                window.location.href = "/login/";
            }, 900);

        } catch (error) {
            messageBox.className = "alert alert-danger mb-3";
            messageBox.textContent = error.message;
        }

    });

});