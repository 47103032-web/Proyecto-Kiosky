// backend/src/middleware/loginRateLimiter.js

const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_FAILED_ATTEMPTS = 5;

export const loginRateLimiter = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) return next();

  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];
  const recentAttempts = attempts.filter(timestamp => now - timestamp < WINDOW_MS);

  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({ 
      ok: false,
      codigo: 'LIMITE_INTENTOS_LOGIN',
      mensaje: 'Demasiados intentos fallidos. Espere 15 minutos antes de intentar nuevamente.',
    });
  }

  loginAttempts.set(email, recentAttempts);

  res.on('finish', () => {
    if (res.statusCode === 200) {
      loginAttempts.delete(email); 
    } else if (res.statusCode === 401 || res.statusCode === 404) {
      const currentAttempts = loginAttempts.get(email) || [];
      currentAttempts.push(Date.now());
      loginAttempts.set(email, currentAttempts); 
    }
  });

  next();
};
