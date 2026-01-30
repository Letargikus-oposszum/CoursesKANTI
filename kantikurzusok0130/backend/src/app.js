import express from "express";
import db from "../db.js";

const PORT = 3000;
const app = express();
app.use(express.json());

app.get("/students/", (req, res) => {
  const clss = req.query.class;
  const students = db
    .prepare("SELECT * FROM students WHERE classes = ?")
    .all(clss);
  res.status(200).json(students);
});

app.get("/students/:id", (req, res) => {
  const id = req.params.id;
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
  res.status(200).json(student);
});

app.post("/course/", (req, res) => {
  const { firstname, lastname, classes, subject } = req.body;
  if (!firstname || !lastname || !classes || !subject) {
    return res.status(400).json({ message: "Too few parameters provided!" });
  }

  let studentId = 0;
  let subjectId = 0;

  const student = db
    .prepare("SELECT * FROM students WHERE firstname == ? AND lastname == ?")
    .all(firstname, lastname);

  if (student) {
    //student exits
    studentId = student.id;
  } else {
    //student does not exist
    const savedStudent = db.prepare("INSERT INTO students (firstname, lastname, classes) VALUES (?, ?,?)").run(
      firstname,
      lastname,
      classes
    );
    studentId = savedStudent.lastInsertRowid;
  }

  const subject_ = db
    .prepare("SELECT * FROM subjects WHERE name = ?")
    .all(subject);

  if (subject_) {
    //subject exits
    subjectId = subject.id;
  } else {
    //subject does not exist
    const savedSubject = db.prepare("INSERT INTO subject (name) VALUES (?)").run(subject);
    subjectId = savedSubject.lastInsertRowid;
  }

 

  const singleClassmember = db
    .prepare(
      "SELECT * FROM classmembers WHERE student_id = ? AND subject_id = ?",
    )
    .get(studentId, subjectId);
 
  if (singleClassmember) {
    res
      .status(400)
      .json({ message: "The student is already member of this course!" });
  } else {
    db.prepare(
      "INSERT INTO classmembers (student_id, subject_id) VALUES (?, ?)",
    ).run(studentId,subjectId);
    res
      .status(201)
      .json({
        message: "The course has been successfully added to the catalog!",
      });
  }
});

app.get("/subject/", (req, res) => {
  const subjects = db.prepare("SELECT * FROM subjects").all();
  const subjectAplhabetic = subjects.sort(function (a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
  res.status(200).json(subjectAplhabetic);
});

app.listen(PORT, () => {
  console.log(`The server is running on port: ${PORT}`);
});
