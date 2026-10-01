document.addEventListener("DOMContentLoaded", async function () {

    const container =
        document.getElementById("profileContainer");

    if (!container) {
        return;
    }

    const token = getAccessToken();

    if (!token) {

        container.innerHTML = `
            <div class="alert alert-danger">
                Please login first.
            </div>
        `;

        return;
    }

    try {

        const response = await apiRequest(
            "/users/api/profile/"
        );

        container.innerHTML = `

            <div class="profile-card">

                <h2>My Profile</h2>

                <p>
                    <strong>Username:</strong>
                    ${response.username}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${response.email || "Not provided"}
                </p>

            </div>
        `;

    } catch (error) {

        container.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }

});