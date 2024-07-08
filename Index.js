const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your_secret_key', // Replace with a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use true if using https
}));

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

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM user WHERE username = ?';
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
        req.session.user = user;
        res.json({ success: true, role: user.role });
      } else {
        res.status(403).json({ success: false, message: 'You are not authorized to access' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  });
});

// Add staff
app.post('/add-staff', (req, res) => {
  const { username, password, role, email } = req.body;
  const sql = 'INSERT INTO user (username, password, role, email) VALUES (?, ?, ?, ?)';

  db.query(sql, [username, password, role, email], (err, result) => {
    if (err) {
      console.error('Error inserting data into user table:', err);
      return res.status(500).json({ message: 'Error adding staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff added successfully', data: result });
  });
});

// View active staff
app.get('/view-staff', (req, res) => {
  const query = 'SELECT * FROM user WHERE status = "Active"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching staff:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// View staff by ID
app.get('/staff/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM user WHERE user_id = ?';
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

// Update staff
app.put('/update-staff/:id', (req, res) => {
  const userId = req.params.id;
  const { username, password, role, email } = req.body;
  const query = 'UPDATE user SET username = ?, password = ?, role = ?, email = ? WHERE user_id = ?';

  db.query(query, [username, password, role, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating staff data:', err);
      return res.status(500).json({ success: false, message: 'Error updating staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff updated successfully', data: result });
  });
});

// Delete staff (mark as resigned)
app.put('/delete-staff/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'UPDATE user SET status = "Resigned" WHERE user_id = ?';

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting staff:', err);
      return res.status(500).json({ success: false, message: 'Error deleting staff', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Staff deleted successfully', data: result });
  });
});

// Add department
app.post('/add-department', (req, res) => {
  const { dept_name, hod_id } = req.body;
  const query = 'INSERT INTO department (dept_name, hod_id) VALUES (?, ?)';

  db.query(query, [dept_name, hod_id], (err, result) => {
    if (err) {
      console.error('Error adding department:', err);
      return res.status(500).json({ success: false, message: 'Error adding department', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Department added successfully', data: result });
  });
});

// Fetch HoD users
app.get('/hod-users', (req, res) => {
  const query = 'SELECT user_id, username FROM user WHERE role = "HoD" AND status = "Active"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching HoD users:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Fetch departments
app.get('/departments', (req, res) => {
  const query = 'SELECT * FROM department';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching departments:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Fetch all users
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM user';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Add user to department
app.post('/add-to-department', (req, res) => {
  const { user_id, dept_id } = req.body;
  console.log('Received request to add user to department:', req.body);

  const query = 'INSERT INTO user_department (user_id, dept_id) VALUES (?, ?)';

  db.query(query, [user_id, dept_id], (err, result) => {
    if (err) {
      console.error('Error adding user to department:', err);
      return res.status(500).json({ success: false, message: 'Error adding user to department', error: err.message });
    }
    res.status(200).json({ success: true, message: 'User added to department successfully', data: result });
  });
});

// Propose event
app.post('/propose-event', (req, res) => {
  const { event_name, event_type, event_date, venue, budget, description, hosting_dept, username } = req.body;

  const query = 'INSERT INTO event (event_name, event_type, event_date, venue, budget, description, hosting_dept, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [event_name, event_type, event_date, venue, budget, description, hosting_dept, username];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding event:', err);
      return res.status(500).json({ success: false, message: 'Error adding event', error: err.message });
    }

    res.status(200).json({ success: true, message: 'Event added successfully', data: result });
  });
});

// Fetch pending events
app.get('/pending', (req, res) => {
  const query = 'SELECT * FROM event WHERE event_status = "Pending"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Fetch approved events
app.get('/approved', (req, res) => {
  const query = 'SELECT * FROM event WHERE event_status = "Approved"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Fetch rejected events
app.get('/rejected', (req, res) => {
  const query = 'SELECT * FROM event WHERE event_status = "Rejected"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Approve event
app.post('/approve/:id', (req, res) => {
  const eventId = req.params.id;
  const query = 'UPDATE event SET event_status = "Approved" WHERE event_id = ?';

  db.query(query, [eventId], (err, result) => {
    if (err) {
      console.error('Error approving event:', err);
      return res.status(500).json({ success: false, message: 'Error approving event', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Event approved successfully', data: result });
  });
});

// Reject event
app.post('/reject/:id', (req, res) => {
  const eventId = req.params.id;
  const query = 'UPDATE event SET event_status = "Rejected" WHERE event_id = ?';

  db.query(query, [eventId], (err, result) => {
    if (err) {
      console.error('Error rejecting event:', err);
      return res.status(500).json({ success: false, message: 'Error rejecting event', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Event rejected successfully', data: result });
  });
});
app.post('/add-event-record', (req, res) => {
  const {
    event_id,
    department_id,
    number_of_activities,
    date_time,
    venue,
    academic_year,
    event_type,
    speaker_name,
    speaker_job,
    target_audience,
    website_contact,
    organizing_committee_details,
    participants_count,
    summary
  } = req.body;

  const query = `INSERT INTO event_record 
    (event_id, department_id, number_of_activities, date_time, venue, academic_year, event_type, 
     speaker_name, speaker_job, target_audience, website_contact, organizing_committee_details, 
     participants_count, summary) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    event_id,
    department_id,
    number_of_activities,
    date_time,
    venue,
    academic_year,
    event_type,
    speaker_name,
    speaker_job,
    target_audience,
    website_contact,
    organizing_committee_details,
    participants_count,
    summary
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding event record:', err);
      return res.status(500).json({ success: false, message: 'Error adding event record', error: err.message });
    }

    res.status(200).json({ success: true, message: 'Event record added successfully', data: result });
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
