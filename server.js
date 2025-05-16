import express from 'express';
import pool from './db.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Cryptext backend is online');
});

// 🔐 Login/authenticatie via 12-woord seed phrase
app.post('/api/auth', async (req, res) => {
  const { phrase } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE seed_phrase = $1',
      [phrase]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Phrase incorrect' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✉️ Bericht opslaan
app.post('/api/messages', async (req, res) => {
  const { user_id, content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING *',
      [user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fout bij opslaan bericht' });
  }
});
app.post('/api/users', async (req, res) => {
  const { cryptext_id, display_name, mnemonic_phrase } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (cryptext_id, display_name, mnemonic_phrase)
       VALUES ($1, $2, $3) RETURNING *`,
      [cryptext_id, display_name, mnemonic_phrase]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Fout bij aanmaken account' });
  }
});


// ✉️ Berichten ophalen
app.get('/api/messages/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fout bij ophalen berichten' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cryptext backend draait op poort ${PORT}`));
