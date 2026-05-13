import cors from 'cors';
import express from 'express';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true });
});
