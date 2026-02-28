import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hostel-erp-secret-key';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { authenticated: false, error: 'Invalid token' };
  }

  return { authenticated: true, user: decoded };
}