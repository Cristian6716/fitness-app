import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

// Keep alive
setInterval(() => {
  console.log('Server still alive...');
}, 5000);