import express, { Application } from 'express';
import bodyParser from 'body-parser';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());
app.use(cors({
  origin: '*',
}));

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`);
  }
});

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'User already exists' });
      } else {
        res.status(201).json({ message: 'User registered successfully' });
      }
    }
  );
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user: User) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
        expiresIn: '1h',
      });
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.get('/ReactCMS-login', (req, res) => {
  res.status(200).json({ message: 'Welcome to ReactCMS' });
});

app.get('/dashboard', (req: express.Request<Record<string, any>, any, any, any>, res: express.Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Access denied' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const payload = decoded as JwtPayload;
    if (payload.role === 'admin') {
      return res.status(200).json({ message: 'Welcome to the admin dashboard' });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});