document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const walletAddress = document.getElementById("wallet-address").value;
    const referralCode = document.getElementById("referral-code").value;

    if (!walletAddress) {
        alert("Por favor, ingresa tu dirección de wallet.");
        return;
    }

    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            referral_code: referralCode,
        }),
    });

    const result = await response.json();
    if (response.ok) {
        document.getElementById("message").textContent = `Registro exitoso. Tu código: ${result.code}`;
        window.location.href = `/game?user=${walletAddress}`; // Redirigir al juego
    } else {
        document.getElementById("message").textContent = `Error: ${result.error}`;
    }
});

document.getElementById("login-button").addEventListener("click", () => {
    window.location.href = "/login"; // Redirigir al login
});