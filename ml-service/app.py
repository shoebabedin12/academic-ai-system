import os

from flask import Flask, request, jsonify
import psycopg2
import re
from difflib import get_close_matches

app = Flask(__name__)

# =========================
# DB CONNECTION
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # ✅ Production (Render / Neon)
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
else:
    # ✅ Local (your PC)
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
# FIND STUDENT (SMART MATCH)
# =========================
def find_student(msg, students):
    words = msg.split()

    # 1️⃣ direct match
    for s in students:
        name = s[1].lower()
        if name in words:
            return s

    # 2️⃣ fuzzy match per word
    names = [s[1].lower() for s in students]

    for word in words:
        match = get_close_matches(word, names, n=1, cutoff=0.6)
        if match:
            for s in students:
                if s[1].lower() == match[0]:
                    return s

    return None


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
    # 2️⃣ GET ALL STUDENTS
    # =========================
    cursor.execute("SELECT id, name, cgpa FROM students")
    all_students = cursor.fetchall()

    student = find_student(msg, all_students)

    # =========================
    # 3️⃣ STUDENT LOGIC
    # =========================
    if student:
        sid, name, cgpa = student

        predicted = round(cgpa + 0.1, 2)

        # fetch subjects
        cursor.execute(
            "SELECT subject_name, marks FROM subjects WHERE student_id=%s",
            (sid,)
        )
        subjects = cursor.fetchall()

        # weak subjects
        weak = [s[0] for s in subjects if s[1] < WEAK_THRESHOLD]

        # needed CGPA
        needed = round(TARGET_CGPA - cgpa, 2)
        if needed < 0:
            needed = 0

        # =========================
        # SUBJECT RESULT
        # =========================
        if "subject" in msg or "all result" in msg:
            if subjects:
                result = ", ".join([f"{s[0]}: {s[1]}" for s in subjects])
                return jsonify({
                    "message": f"{name} subjects → {result}"
                })
            else:
                return jsonify({
                    "message": f"{name} has no subject data"
                })

        # =========================
        # CGPA QUERY
        # =========================
        if "cgpa" in msg or "result" in msg:
            return jsonify({
                "message": f"{name} → CGPA: {predicted}, Needed: {needed}"
            })

        # =========================
        # WEAK SUBJECT
        # =========================
        if "weak" in msg or "focus" in msg:
            return jsonify({
                "message": f"{name} weak subjects: {', '.join(weak)}"
                if weak else f"{name} has no weak subjects"
            })

        # =========================
        # DEFAULT RESPONSE
        # =========================
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
# if __name__ == "__main__":
#     app.run(port=6000)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=True)
port = int(os.environ.get("PORT", 6000))