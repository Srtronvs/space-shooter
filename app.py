from flask import Flask, request, jsonify, render_template, redirect, url_for
from base import load_data, register_user, get_user, update_points

app = Flask(__name__)

# Ruta principal (registro)
@app.route("/")
def index():
    return render_template("index.html")

# Ruta para login
@app.route("/login")
def login():
    return render_template("login.html")

# Ruta para login con código de invitación
@app.route("/login/<code>")
def login_with_code(code):
    db = load_data()
    if code not in db["codes"]:
        return redirect(url_for("index"))  # Redirigir si el código no es válido
    return render_template("index.html", referral_code=code)

# Ruta para registrar un nuevo usuario
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    wallet_address = data.get("wallet_address")
    referral_code = data.get("referral_code")

    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    result = register_user(wallet_address, referral_code)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result), 200

# Ruta para verificar el login
@app.route("/check_login", methods=["POST"])
def check_login():
    data = request.json
    wallet_address = data.get("wallet_address")

    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    user_data = get_user(wallet_address)
    if "error" in user_data:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "Login successful", "user": user_data}), 200

# Ruta para el juego
@app.route("/game")
def game():
    return render_template("game.html")

if __name__ == '__main__':
    # Ejecutar el servidor en la red local
    app.run(host='0.0.0.0', port=5000, debug=True)