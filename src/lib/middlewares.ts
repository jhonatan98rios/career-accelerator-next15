import { verifyToken } from "./auth";

function getUserFromHeader(headers: Headers) {
  const auth = headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.split(' ')[1];
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}