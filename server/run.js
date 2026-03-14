import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

// Keep process alive when run under concurrently (closed stdin can cause Node to exit)
if (!process.stdin.isTTY) {
  process.stdin.resume();
}

const server = app.listen(PORT, () => {
  console.log(`STATIQ API listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
