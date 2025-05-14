export const SECRET_KEY = process.env.JWT_SECRET || 'default-key';
if (SECRET_KEY === 'default-key') {
  console.warn('⚠️  Avertissement : SECRET_KEY par défaut utilisée. Pensez à configurer .env !');
}
