export type Role = 'ADMIN' | 'USER' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface User{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    status: UserStatus;
    createdAt: string;
    emailVerified: boolean;
}

export interface LoginRequest{
    email: string;
    password: string;
}

export interface LoginResponse{
    token: string;
    refresToken: string;
    user: User;
    tokenType: string;
}

