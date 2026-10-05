const app = require('./app');
const { ensureSchema } = require('./schema');

const PORT = Number(process.env.PORT || 3000);

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`QA Shop API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
