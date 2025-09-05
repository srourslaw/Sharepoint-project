export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  user: AuthenticatedUser;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}