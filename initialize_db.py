import psycopg2
from psycopg2 import sql
import os

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to the PostgreSQL database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

runners = [
    ("John", "Doe", "r0000001", 1, "2025-02-03T14:26:37.970Z", 1, "1.12", True),
    ("Jane", "Smith", "r0000002", 2, "2025-02-03T14:26:37.970Z", 2, "2.12", False),
    ("Alice", "Johnson", "r0000003", 1, "2025-02-03T14:26:37.970Z", 2, "1.3", True),
    ("Bob", "Williams", "r0000004", 2, "2025-02-03T14:30:00.000Z", 1, "1.45", False),
    ("Clara", "Brown", "r0000005", 1, "2025-02-03T14:31:00.000Z", 2, "2.05", True),
    ("David", "Miller", "r0000006", 2, "2025-02-03T14:32:00.000Z", 1, "1.20", True),
    ("Eva", "Davis", "r0000007", 1, "2025-02-03T14:33:00.000Z", 2, "1.55", False),
    ("Frank", "Garcia", "r0000008", 2, "2025-02-03T14:34:00.000Z", 1, "2.10", True),
    ("Grace", "Martinez", "r0000009", 1, "2025-02-03T14:35:00.000Z", 2, "1.40", False),
    ("Henry", "Rodriguez", "r0000010", 2, "2025-02-03T14:36:00.000Z", 1, "1.33", True),
    ("Ivy", "Wilson", "r0000011", 1, "2025-02-03T14:37:00.000Z", 2, "2.25", False),
    ("Jack", "Anderson", "r0000012", 2, "2025-02-03T14:38:00.000Z", 1, "1.18", True),
    ("Kara", "Thomas", "r0000013", 1, "2025-02-03T14:39:00.000Z", 2, "1.50", False),
    ("Leo", "Taylor", "r0000014", 2, "2025-02-03T14:40:00.000Z", 1, "2.00", True),
    ("Mia", "Hernandez", "r0000015", 1, "2025-02-03T14:41:00.000Z", 2, "1.27", False),
    ("Noah", "Moore", "r0000016", 2, "2025-02-03T14:42:00.000Z", 1, "1.36", True),
    ("Olivia", "Jackson", "r0000017", 1, "2025-02-03T14:43:00.000Z", 2, "1.42", True),
    ("Paul", "Martin", "r0000018", 2, "2025-02-03T14:44:00.000Z", 1, "1.58", False),
    ("Quinn", "Lee", "r0000019", 1, "2025-02-03T14:45:00.000Z", 2, "2.20", True),
    ("Ruby", "Perez", "r0000020", 2, "2025-02-03T14:46:00.000Z", 1, "1.10", False),
    ("Sam", "White", "r0000021", 1, "2025-02-03T14:47:00.000Z", 2, "1.49", True),
    ("Tina", "Harris", "r0000022", 2, "2025-02-03T14:48:00.000Z", 1, "1.22", False),
    ("Uma", "Clark", "r0000023", 1, "2025-02-03T14:49:00.000Z", 2, "2.07", True),
    ("Victor", "Lewis", "r0000024", 2, "2025-02-03T14:50:00.000Z", 1, "1.31", True),
    ("Wendy", "Robinson", "r0000025", 1, "2025-02-03T14:51:00.000Z", 2, "1.39", False),
]

groups = [
    (1, "Groep 1"),
    (2, "Testgroep 2"),
]

faculties = [
    ("Faculteit Ingenieurswetenschappen"),
    ("Faculteit Wetenschappen"),
]

# Insert data into Runner table
for first_name, last_name, identification, faculty_id, registration_time, group_number, test_time, first_year in runners:
    cur.execute(
        sql.SQL('INSERT INTO "Runner" ("firstName", "lastName", "identification", "facultyId", "registrationTime", "groupNumber", "testTime", "firstYear") VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT ("identification") DO NOTHING'),
        [first_name, last_name, identification, faculty_id, registration_time, group_number, test_time, first_year]
    )

# Insert data into Group table
for group_number, group_name in groups:
    cur.execute(
        sql.SQL('INSERT INTO \"Group\" ("groupNumber", "groupName") VALUES (%s, %s) ON CONFLICT ("groupNumber") DO NOTHING'),
        [group_number, group_name]
    )

# Insert data into Faculty table
for name in faculties:
    cur.execute(
        sql.SQL('INSERT INTO "Faculty" ("name") VALUES (%s) ON CONFLICT DO NOTHING'),
        [name]
    )

# Insert data into GlobalState table
cur.execute(
    sql.SQL('INSERT INTO "GlobalState" ("id", "raining") VALUES (1, false) ON CONFLICT DO NOTHING')
)

# Commit the transaction
conn.commit()

# Close the cursor and connection
cur.close()
conn.close()

print("Dummy data inserted successfully.")