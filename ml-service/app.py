from flask import Flask, request, jsonify
import psycopg2
import re

app = Flask(__name__)

# =========================
# DB CONNECTION
# =========================
conn = psycopg2.connect(
    host="localhost",
    database="academic_ai",
    user="postgres",
    password="123456",
    port=5432
)
cursor = conn.cursor()

TARGET_CGPA = 3.5
WEAK_THRESHOLD = 50


# =========================
# CLEAN TEXT
# =========================
def clean(text):
    return re.sub(r'[^a-zA-Z\s]', '', text).strip().lower()


# =========================
# MAIN CHAT ROUTE
# =========================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    msg = clean(data.get("message", ""))

    # =========================
    # 1️⃣ ALL STUDENTS
    # =========================
    if "all" in msg and "student" in msg:
        cursor.execute("SELECT name FROM students")
        students = [row[0] for row in cursor.fetchall()]

        return jsonify({
            "message": f"All Students: {', '.join(students)}"
        })

    # =========================
    # 2️⃣ FIND STUDENT
    # =========================
    cursor.execute("SELECT id, name, cgpa FROM students")
    all_students = cursor.fetchall()

    student = None

    for s in all_students:
        if s[1].lower() in msg:
            student = s
            break

    # =========================
    # 3️⃣ STUDENT LOGIC
    # =========================
    if student:
        sid, name, cgpa = student

        # fake ML (you can upgrade later)
        predicted = round(cgpa + 0.1, 2)

        # weak subjects
        cursor.execute(
            "SELECT subject_name, marks FROM subjects WHERE student_id=%s",
            (sid,)
        )

        weak = [
            row[0] for row in cursor.fetchall()
            if row[1] < WEAK_THRESHOLD
        ]

        needed = round(TARGET_CGPA - cgpa, 2)
        if needed < 0:
            needed = 0

        if "cgpa" in msg:
            return jsonify({
                "message": f"{name} CGPA: {predicted}, Needed: {needed}"
            })

        if "weak" in msg or "focus" in msg:
            return jsonify({
                "message": f"{name} weak subjects: {', '.join(weak)}" if weak else f"{name} has no weak subjects"
            })

        return jsonify({
            "message": f"{name} → CGPA: {predicted}, Needed: {needed}"
        })

    # =========================
    # 4️⃣ NOT STUDENT QUERY
    # =========================
    return jsonify({
        "message": "NOT_STUDENT_QUERY"
    })


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(port=6000)