from flask import Flask, request, jsonify
import psycopg2

app = Flask(__name__)

# PostgreSQL connection
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

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    student_name = data.get("student_name", "").strip().lower()
    
    cursor.execute(
        "SELECT id, name, cgpa, last_semester_gpa, attendance FROM students WHERE LOWER(name)=LOWER(%s)",
        (student_name,)
    )
    student = cursor.fetchone()
    if not student:
        return jsonify({"error": f"Student {student_name} not found"})
    
    student_id, name, cgpa, last_gpa, attendance = student
    predicted_cgpa = round(cgpa + 0.1, 2)  # placeholder ML logic

    cursor.execute(
        "SELECT subject_name, marks FROM subjects WHERE student_id=%s", (student_id,)
    )
    weak_subjects = [row[0] for row in cursor.fetchall() if row[1] < WEAK_THRESHOLD]

    needed_cgpa = round(TARGET_CGPA - cgpa, 2)
    if needed_cgpa < 0:
        needed_cgpa = 0.0

    return jsonify({
        "name": name,
        "predicted_cgpa": predicted_cgpa,
        "weak_subjects": weak_subjects,
        "needed_cgpa": needed_cgpa
    })


if __name__ == "__main__":
    app.run(port=6000)