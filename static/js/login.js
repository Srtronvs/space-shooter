document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const walletAddress = document.getElementById("wallet-address").value;

    if (!walletAddress) {
        alert("Por favor, ingresa tu dirección de wallet.");
        return;
    }

    const response = await fetch("/check_login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
        }),
    });

    const result = await response.json();
    if (response.ok) {
        window.location.href = `/game?user=${walletAddress}`; // Redirigir al juego
    } else {
        document.getElementById("message").textContent = `Error: ${result.error}`;
    }
});

document.getElementById("register-button").addEventListener("click", () => {
    window.location.href = "/"; // Redirigir al registro
});