# 🧠 ML Service (Python)

This service handles:

* Student data processing (PostgreSQL)
* CGPA prediction logic
* Weak subject detection
* API endpoints for MCP server

---

## 🚀 Setup Guide

### 1️⃣ Clone Project

```bash
git clone <your-repo-url>
cd ml-service
```

---

## 🐍 Virtual Environment Setup

### 🔹 Create venv

```bash
python -m venv venv
```

### 🔹 Activate venv

#### Windows (CMD)

```bash
venv\Scripts\activate
```

#### PowerShell

```bash
.\venv\Scripts\Activate
```

#### Git Bash

```bash
source venv/Scripts/activate
```

#### Linux / Mac

```bash
source venv/bin/activate
```

---

## 📦 Install Dependencies

```bash
pip install -r requirements.txt
```

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file:

```env
DB_HOST=localhost
DB_NAME=academic_ai
DB_USER=postgres
DB_PASS=123456
DB_PORT=5432
```

---

## ▶️ Run the Server

```bash
python app.py
```

Server will start at:

```
http://127.0.0.1:6000
```

---

## 📡 API Endpoints

### 🔹 Predict Student

```http
POST /predict
```

**Body:**

```json
{
  "student_name": "Rahim"
}
```

---

### 🔹 All Students

```http
GET /all-students
```

---

### 🔹 Weak Subjects

```http
POST /weak-subjects
```

---

## 🧪 Test Example (Postman / Curl)

```bash
curl -X POST http://127.0.0.1:6000/predict \
-H "Content-Type: application/json" \
-d '{"student_name":"Rahim"}'
```

---

## 🛠 Tech Stack

* Python (Flask)
* PostgreSQL
* psycopg2
* REST API


---

## ⚠️ Notes

* Make sure PostgreSQL is running
* Update DB credentials if needed
* Activate venv before running server
