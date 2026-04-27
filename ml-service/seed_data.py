import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="academic_ai",
    user="postgres",
    password="123456",
    port=5432
)
cursor = conn.cursor()

# ✅ সব student এর data এখানে লিখুন
students_data = [
    {
        "name": "Arif Hossain",
        "cgpa": 3.10,
        "subjects": [
            ("Math", 78), ("Physics", 55), ("Chemistry", 82),
            ("English", 90), ("Programming", 88)
        ],
        "semesters": [(1, 2.90), (2, 3.00), (3, 3.10)]
    },
    {
        "name": "Nadia Islam",
        "cgpa": 3.45,
        "subjects": [
            ("Math", 85), ("Physics", 72), ("Chemistry", 90),
            ("English", 88), ("Programming", 92)
        ],
        "semesters": [(1, 3.10), (2, 3.30), (3, 3.45)]
    },
    {
        "name": "Sabbir Ahmed",
        "cgpa": 2.70,
        "subjects": [
            ("Math", 45), ("Physics", 40), ("Chemistry", 55),
            ("English", 70), ("Programming", 60)
        ],
        "semesters": [(1, 2.40), (2, 2.55), (3, 2.70)]
    },
    # ✅ এইভাবে যত খুশি add করুন...
]

for s in students_data:
    # Student insert
    cursor.execute(
        "INSERT INTO students (name, cgpa) VALUES (%s, %s) RETURNING id",
        (s["name"], s["cgpa"])
    )
    sid = cursor.fetchone()[0]
    print(f"✅ Added student: {s['name']} (id={sid})")

    # Subjects insert
    for subject_name, marks in s["subjects"]:
        cursor.execute(
            "INSERT INTO subjects (student_id, subject_name, marks) VALUES (%s, %s, %s)",
            (sid, subject_name, marks)
        )

    # Semester results insert
    for semester, cgpa in s["semesters"]:
        cursor.execute(
            "INSERT INTO semester_results (student_id, semester, cgpa) VALUES (%s, %s, %s)",
            (sid, semester, cgpa)
        )

conn.commit()
print("🎉 সব data successfully added!")
cursor.close()
conn.close()