const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== AUTH & MOCK LOGIN ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, role } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email.split('@')[0],
          email,
          password: 'password123', // In real app, use bcrypt hashing
          role: role || 'STUDENT',
        },
      });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== STUDENTS / USERS ENDPOINTS ====================
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { attendances: true, marks: true, fees: true },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, rollNo, department, year, semester } = req.body;
    const student = await prisma.user.create({
      data: {
        name,
        email,
        password: 'password123',
        role: 'STUDENT',
        rollNo,
        department,
        year,
        semester,
      },
    });
    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create student or Roll/Email already exists' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ==================== COURSES ENDPOINTS ====================
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { batches: true },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { title, code, description, duration } = req.body;
    const newCourse = await prisma.course.create({
      data: { title, code, description, duration },
    });
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create course or Course Code already exists' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================
app.post('/api/attendance', async (req, res) => {
  try {
    const { userId, status, date } = req.body;
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        status, // 'PRESENT' or 'ABSENT'
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: 'Failed to record attendance' });
  }
});

// ==================== MARKS ENDPOINTS ====================
app.post('/api/marks', async (req, res) => {
  try {
    const { userId, subject, examName, marksGained, totalMarks } = req.body;
    const mark = await prisma.mark.create({
      data: {
        userId,
        subject,
        examName,
        marksGained: parseFloat(marksGained),
        totalMarks: parseFloat(totalMarks),
      },
    });
    res.status(201).json(mark);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add mark entry' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 IMS Server running on http://localhost:${PORT}`);
});