import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt
import mysql.connector
from datetime import datetime
from flask_cors import CORS
from functools import wraps
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

load_dotenv()  # reads variables from a local .env file (not committed to git)

app = Flask(__name__)
CORS(app)

# -----------------------
# JWT Config
# -----------------------
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "change-me-in-env")
jwt = JWTManager(app)

# -----------------------
# MySQL Connection Helper
# -----------------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "pharmacy")
    )

# -----------------------
# Admin-only decorator
# -----------------------
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"msg": "Access denied: Admins only"}), 403
        return fn(*args, **kwargs)
    return wrapper

# -----------------------
# Background Scheduler
# -----------------------
def check_low_stock_and_expired():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    today = datetime.now().strftime('%Y-%m-%d')

    cursor.execute("SELECT * FROM Medicines WHERE Stock_Quantity < 10")
    low_stock = cursor.fetchall()
    if low_stock:
        print(f"[ALERT] Low stock medicines: {[m['Name'] for m in low_stock]}")

    cursor.execute("SELECT * FROM Medicines WHERE Expiry_Date < %s", (today,))
    expired = cursor.fetchall()
    if expired:
        print(f"[ALERT] Expired medicines: {[m['Name'] for m in expired]}")

    cursor.close()
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_low_stock_and_expired, "interval", minutes=5)
scheduler.start()

# -----------------------
# Test route
# -----------------------
@app.route("/")
def index():
    return "Flask server is running!"

# -----------------------
# Admin Auth
# -----------------------
@app.route("/api/admin/register", methods=["POST"])
def register_admin():
    data = request.get_json()
    db = get_db_connection()
    cursor = db.cursor()
    sql = "INSERT INTO Admins (Username, Password) VALUES (%s, %s)"
    cursor.execute(sql, (data['username'], data['password']))
    db.commit()
    admin_id = cursor.lastrowid
    cursor.close()
    db.close()
    return jsonify({"msg": "Admin registered", "admin_id": admin_id}), 201

@app.route("/api/admin/login", methods=["POST"])
def login_admin():
    data = request.get_json()
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Admins WHERE Username = %s AND Password = %s", 
                   (data['username'], data['password']))
    admin = cursor.fetchone()
    cursor.close()
    db.close()
    if admin:
        token = create_access_token(identity=str(admin['Admin_ID']), additional_claims={"role": "admin"})
        return jsonify({"msg": "Login successful", "token": token})
    return jsonify({"msg": "Invalid credentials"}), 401

# -----------------------
# Customers CRUD
# -----------------------
@app.route("/api/customers", methods=["GET"])
@admin_required
def customers_list():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Customers")
    customers = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(customers)

@app.route("/api/customers", methods=["POST"])
@admin_required
def customers_add():
    data = request.get_json()
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Customers (Name, Phone_Number, Email) VALUES (%s, %s, %s)",
                   (data['Name'], data['Phone_Number'], data['Email']))
    db.commit()
    customer_id = cursor.lastrowid
    cursor.close()
    db.close()
    return jsonify({"msg": "Customer added", "customer_id": customer_id}), 201

# -----------------------
# Medicines CRUD
# -----------------------
@app.route("/api/medicines", methods=["GET"])
@jwt_required()
def medicines_list():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Medicines")
    medicines = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(medicines), 200

@app.route("/api/medicines", methods=["POST"])
@admin_required
def medicines_add():
    data = request.get_json()
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""INSERT INTO Medicines 
                      (Name, Category, Manufacturer, Price, Stock_Quantity, Batch_No, Expiry_Date)
                      VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                   (data['Name'], data['Category'], data['Manufacturer'],
                    data['Price'], data['Stock_Quantity'], data['Batch_No'], data['Expiry_Date']))
    db.commit()
    medicine_id = cursor.lastrowid
    cursor.close()
    db.close()
    return jsonify({"msg": "Medicine added", "medicine_id": medicine_id}), 201

# -----------------------
# Prescriptions CRUD (with multiple medicines)
# -----------------------
@app.route("/api/prescriptions", methods=["POST"])
@admin_required
def prescriptions_add():
    data = request.get_json()
    try:
        db = get_db_connection()
        cursor = db.cursor()

        # Insert prescription
        cursor.execute("""INSERT INTO Prescriptions (Doctor_Name, Date_Issued, Customer_ID, Duration)
                          VALUES (%s, %s, %s, %s)""",
                       (data['Doctor_Name'], datetime.now().strftime('%Y-%m-%d'),
                        data['Customer_ID'], data['Duration']))
        prescription_id = cursor.lastrowid

        # Insert medicines into junction table
        for med in data['medicines']:
            cursor.execute("""INSERT INTO Prescription_Medicines (Prescription_ID, Medicine_ID, Dosage)
                              VALUES (%s, %s, %s)""",
                           (prescription_id, med['Medicine_ID'], med['Dosage']))

        db.commit()
        cursor.close()
        db.close()
        return jsonify({"msg": "Prescription added", "prescription_id": prescription_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/prescriptions", methods=["GET"])
@admin_required
def prescriptions_list():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""SELECT p.Prescription_ID, p.Doctor_Name, p.Date_Issued, p.Duration,
                             c.Name AS Customer_Name
                      FROM Prescriptions p
                      JOIN Customers c ON p.Customer_ID = c.Customer_ID""")
    prescriptions = cursor.fetchall()

    # Attach medicines for each prescription
    for pres in prescriptions:
        cursor.execute("""SELECT m.Name AS Medicine_Name, pm.Dosage
                          FROM Prescription_Medicines pm
                          JOIN Medicines m ON pm.Medicine_ID = m.Medicine_ID
                          WHERE pm.Prescription_ID = %s""", (pres['Prescription_ID'],))
        pres['Medicines'] = cursor.fetchall()
        pres['Date_Issued'] = str(pres['Date_Issued'])

    cursor.close()
    db.close()
    return jsonify(prescriptions)

# -----------------------
# Sales (similar logic)
# -----------------------
@app.route("/api/sales", methods=["POST"])
@admin_required
def sales_create():
    data = request.get_json()
    medicines = data["medicines"]
    total_amount = 0

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Calculate total
    for item in medicines:
        cursor.execute("SELECT Stock_Quantity, Price FROM Medicines WHERE Medicine_ID=%s", (item["Medicine_ID"],))
        medicine = cursor.fetchone()
        if not medicine:
            return jsonify({"error": "Medicine not found"}), 404
        if medicine["Stock_Quantity"] < item["Quantity"]:
            return jsonify({"error": f"Not enough stock for medicine {item['Medicine_ID']}"}), 400
        total_amount += float(medicine["Price"]) * int(item["Quantity"])

    # Insert Sale
    cursor2 = db.cursor()
    cursor2.execute("""INSERT INTO Sales (Payment_Method, Date, Total_Amount, Customer_ID)
                       VALUES (%s, %s, %s, %s)""",
                    (data["Payment_Method"], datetime.now().strftime('%Y-%m-%d'),
                     total_amount, data["Customer_ID"]))
    sale_id = cursor2.lastrowid

    # Insert medicines into Sales_Contains and update stock
    for item in medicines:
        cursor.execute("SELECT Price FROM Medicines WHERE Medicine_ID=%s", (item["Medicine_ID"],))
        price = cursor.fetchone()["Price"]
        cursor2.execute("""INSERT INTO Sales_Contains (Sale_ID, Medicine_ID, Unit_Price, Quantity)
                           VALUES (%s, %s, %s, %s)""",
                        (sale_id, item["Medicine_ID"], price, item["Quantity"]))
        cursor2.execute("UPDATE Medicines SET Stock_Quantity = Stock_Quantity - %s WHERE Medicine_ID=%s",
                        (item["Quantity"], item["Medicine_ID"]))

    db.commit()
    cursor.close()
    cursor2.close()
    db.close()
    return jsonify({"msg": "Sale recorded", "sale_id": sale_id}), 201

# -----------------------
# Run
# -----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "True") == "True"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
