import json
import os
import uuid

DATA_FILE = "data.json"

def load_data():
    """Cargar datos desde data.json."""
    if not os.path.exists(DATA_FILE):
        return {"users": {}, "codes": {}}
    with open(DATA_FILE, "r") as file:
        return json.load(file)

def save_data(data):
    """Guardar datos en data.json."""
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

def generate_code():
    """Generar un código único de 6 caracteres."""
    return str(uuid.uuid4())[:6].upper()

def register_user(wallet_address, referral_code=None):
    """Registrar un nuevo usuario."""
    db = load_data()

    if wallet_address in db["users"]:
        return {"error": "User already exists"}

    user_code = generate_code()
    while user_code in db["codes"]:
        user_code = generate_code()

    db["users"][wallet_address] = {
        "code": user_code,
        "referrals": [],
        "points": 0
    }
    db["codes"][user_code] = wallet_address

    if referral_code and referral_code in db["codes"]:
        referrer_wallet = db["codes"][referral_code]
        db["users"][referrer_wallet]["referrals"].append(wallet_address)

    save_data(db)
    return {"message": "User registered successfully", "code": user_code}

def get_user(wallet_address):
    """Obtener información de un usuario."""
    db = load_data()
    if wallet_address not in db["users"]:
        return {"error": "User not found"}
    return db["users"][wallet_address]

def update_points(wallet_address, points):
    """Actualizar los puntos de un usuario."""
    db = load_data()
    if wallet_address not in db["users"]:
        return {"error": "User not found"}
    db["users"][wallet_address]["points"] += points
    save_data(db)
    return {"message": "Points updated successfully"}