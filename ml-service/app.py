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
    intent = data.get("intent", "")  # ✅ Node থেকে intent নিন
    student_name = data.get("student_name", "")

    try:
        # ✅ Intent based routing — keyword match লাগবে না!
        if intent == "all_students":
            cursor.execute("SELECT name FROM students")
            students = [row[0] for row in cursor.fetchall()]
            return jsonify({"message": f"All Students:\n" + "\n".join(f"• {s}" for s in students)})

        if intent == "all_results":
            cursor.execute("""
                SELECT s.name, s.cgpa,
                       COALESCE(string_agg(sub.subject_name || ': ' || sub.marks::text, ', '), 'No subjects') as subjects
                FROM students s
                LEFT JOIN subjects sub ON s.id = sub.student_id
                GROUP BY s.id, s.name, s.cgpa ORDER BY s.name
            """)
            rows = cursor.fetchall()
            result_text = "\n".join([f"**{r[0]}** → CGPA: {r[1]} | {r[2]}" for r in rows])
            return jsonify({"message": result_text})

        # ✅ Student specific queries
        cursor.execute("SELECT id, name, cgpa FROM students")
        all_students = cursor.fetchall()
        
        # student_name আগে check করো, তারপর msg
        search = student_name if student_name else msg
        student = find_student(search, all_students)

        if student:
            sid, name, cgpa = student
            predicted = round(cgpa + 0.1, 2)
            needed = max(round(TARGET_CGPA - cgpa, 2), 0)

            cursor.execute("SELECT subject_name, marks FROM subjects WHERE student_id=%s", (sid,))
            subjects = cursor.fetchall()
            weak = [s[0] for s in subjects if s[1] < WEAK_THRESHOLD]

            if intent == "weak_subjects":
                return jsonify({
                    "message": f"{name} weak subjects: {', '.join(weak)}" if weak else f"{name} has no weak subjects"
                })

            if intent in ["student_result", "student_cgpa"]:
                subject_str = ", ".join([f"{s[0]}: {s[1]}" for s in subjects]) if subjects else "No data"
                return jsonify({
                    "message": f"**{name}**\nCGPA: {predicted} | Need: {needed} more\nSubjects: {subject_str}"
                })

            # default
            return jsonify({"message": f"{name} → CGPA: {predicted}, Needed: {needed}"})

        return jsonify({"message": "NOT_STUDENT_QUERY"})

    except Exception as e:
        conn.rollback()
        print("Error:", e)
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.route("/semester", methods=["POST"])
def semester():
    data = request.get_json()
    msg = clean(data.get("message", ""))

    try:
        cursor.execute("SELECT id, name, cgpa FROM students")
        all_students = cursor.fetchall()
        student = find_student(msg, all_students)

        if not student:
            return jsonify({"message": "Student not found"})

        sid, name, _ = student

        cursor.execute(
            "SELECT semester, cgpa FROM semester_results WHERE student_id=%s ORDER BY semester",
            (sid,)
        )
        rows = cursor.fetchall()

        if not rows:
            return jsonify({"message": f"{name} has no semester data"})

        data_points = [{"semester": r[0], "cgpa": float(r[1])} for r in rows]

        return jsonify({
            "student": name,
            "semesters": data_points,
            "message": f"{name} এর semester data পাওয়া গেছে"
        })

    except Exception as e:
        conn.rollback()  # ✅ error হলে rollback করুন
        print("Semester error:", e)
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.route("/admin/add-student", methods=["POST"])
def add_student():
    data = request.get_json()
    try:
        # Student insert
        cursor.execute(
            "INSERT INTO students (name, cgpa) VALUES (%s, %s) RETURNING id",
            (data["name"], data["cgpa"])
        )
        sid = cursor.fetchone()[0]

        # Subjects insert
        for sub in data.get("subjects", []):
            cursor.execute(
                "INSERT INTO subjects (student_id, subject_name, marks) VALUES (%s, %s, %s)",
                (sid, sub["name"], sub["marks"])
            )

        # Semesters insert
        for sem in data.get("semesters", []):
            cursor.execute(
                "INSERT INTO semester_results (student_id, semester, cgpa) VALUES (%s, %s, %s)",
                (sid, sem["semester"], sem["cgpa"])
            )

        conn.commit()
        return jsonify({"message": f"✅ {data['name']} successfully added!", "id": sid})

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500



@app.route("/admin/all-data", methods=["GET"])
def all_data():
    cursor.execute("""
        SELECT s.id, s.name, s.cgpa,
               json_agg(DISTINCT jsonb_build_object('subject', sub.subject_name, 'marks', sub.marks)) as subjects,
               json_agg(DISTINCT jsonb_build_object('semester', sr.semester, 'cgpa', sr.cgpa)) as semesters
        FROM students s
        LEFT JOIN subjects sub ON s.id = sub.student_id
        LEFT JOIN semester_results sr ON s.id = sr.student_id
        GROUP BY s.id, s.name, s.cgpa
    """)
    rows = cursor.fetchall()
    result = []
    for r in rows:
        result.append({
            "id": r[0], "name": r[1], "cgpa": float(r[2]),
            "subjects": r[3], "semesters": r[4]
        })
    return jsonify(result)
# =========================
# RUN SERVER
# =========================
# if __name__ == "__main__":
#     app.run(port=6000)

port = int(os.environ.get("PORT", 6000))
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=True)