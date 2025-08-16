interface JWTPayload {
  sub: string;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function extractUserFromToken(token: string) {
  const payload = decodeJWT(token);
  console.log('JWT Payload:', payload); // Debug log
  if (!payload) return null;
  
  // Handle different ID formats
  let userId: number;
  if (typeof payload.sub === 'string') {
    userId = parseInt(payload.sub) || 1; // Fallback to 1 if parsing fails
  } else {
    userId = payload.sub || 1;
  }
  
  // Handle role format - remove "Role." prefix if present
  let userRole = payload.role;
  if (typeof userRole === 'string' && userRole.startsWith('Role.')) {
    userRole = userRole.replace('Role.', '');
  }
  
  const user = {
    id: userId,
    username: payload.username,
    role: userRole
  };
  console.log('Extracted user:', user); // Debug log
  return user;
}
