const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sharon@123', // Replace with your MySQL password
  database: 'ERMS', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database.');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM User WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'User does not exist' });
    }

    const user = results[0];

    if (user.password === password) {
      if (user.status === 'Active') {
        res.json({ success: true, role: user.role });
      } else {
        res.status(403).json({ success: false, message: 'You are not authorized to access' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  });
});

app.post('/add-staff', (req, res) => {
  const { username, password, role, email } = req.body;
  const sql = 'INSERT INTO User (username, password, role, email) VALUES (?, ?, ?, ?)';

  db.query(sql, [username, password, role, email], (err, result) => {
    if (err) {
      console.error('Error inserting data into User table:', err);
      return res.status(500).json({ message: 'Error adding staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff added successfully', data: result });
  });
});

app.get('/view-staff', (req, res) => {
  const query = 'SELECT * FROM User WHERE status = "Active"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching staff:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/staff/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM User WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching staff data:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    res.json(results[0]);
  });
});

app.put('/update-staff/:id', (req, res) => {
  const userId = req.params.id;
  const { username, password, role, email } = req.body;
  const query = 'UPDATE User SET username = ?, password = ?, role = ?, email = ? WHERE user_id = ?';

  db.query(query, [username, password, role, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating staff data:', err);
      return res.status(500).json({ success: false, message: 'Error updating staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff updated successfully', data: result });
  });
});

app.put('/delete-staff/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'UPDATE User SET status = "Resigned" WHERE user_id = ?';

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting staff:', err);
      return res.status(500).json({ success: false, message: 'Error deleting staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff deleted successfully', data: result });
  });
});
app.post('/add-department', (req, res) => {
  const { dept_name, hod_id } = req.body;
  const query = 'INSERT INTO Department (dept_name, hod_id) VALUES (?, ?)';

  db.query(query, [dept_name, hod_id], (err, result) => {
    if (err) {
      console.error('Error adding department:', err);
      return res.status(500).json({ success: false, message: 'Error adding department', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Department added successfully', data: result });
  });
});
app.get('/hod-users', (req, res) => {
  const query = 'SELECT user_id, username FROM User WHERE role = "HoD" AND status = "Active"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching HoD users:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
