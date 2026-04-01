import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoginRequest } from '../models/login-request.model';
import {
  UserSignupRequest,
  AdminSignupRequest,
} from '../models/signup-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { JwtPayload, User } from '../models/user.model';
export type { JwtPayload, User };

const TOKEN_KEY = 'eduverse_access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private API_BASE = 'http://localhost:8000/auth/token'; // adjust if needed

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  // ============================
  // PUBLIC METHODS
  // ============================

  login(payload: LoginRequest): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('username', payload.email); // backend uses "username"
    body.set('password', payload.password);
    body.set('grant_type', 'password');

    return this.http
      .post<AuthResponse>(`${this.API_BASE}`, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(tap((res) => this.handleAuthSuccess(res.access_token)));
  }

  signup(payload: any, role: 'student' | 'teacher' | 'admin'): Observable<any> {
    let url = '';
    switch (role) {
      case 'student':
        url = 'http://localhost:8000/auth/student/signup';
        break;
      case 'teacher':
        url = 'http://localhost:8000/auth/teacher/signup';
        break;
      case 'admin':
        url = 'http://localhost:8000/auth/admin/signup';
        break;
      default:
        throw new Error('Invalid role for signup');
    }

    return this.http.post(url, payload);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('tenantId');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): User['role'] | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  // getRole(): 'student' | 'admin' | 'teacher' | null {
  //   return this.currentUserSubject.value?.role ?? null;
  // }

  getTenantId(): string | null {
    return this.currentUserSubject.value?.tenantId ?? null;
  }

  // ============================
  // PRIVATE HELPERS
  // ============================

  private restoreSession(): void {
    const token = this.getAccessToken();
    if (!token) return;

    const payload = this.decodeJwt(token);

    if (this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    const user = this.mapJwtToUser(payload);
    if (user.tenantId) {
      localStorage.setItem('tenantId', user.tenantId);
    }
    if (user.id) {
      localStorage.setItem('eduverse_user_id', user.id);
    }
    if (user.studentId) {
      localStorage.setItem('eduverse_student_id', user.studentId);
    }
    this.currentUserSubject.next(user);
  }

  private decodeJwt(token: string): JwtPayload {
    return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
  }

  private mapJwtToUser(payload: JwtPayload): User {
    return {
      id: payload.user_id, // was sub
      email: payload.email ?? '', // fallback if email not present in JWT
      role: payload.role,
      tenantId: payload.tenant_id,
      studentId: payload.student_id,
      teacherId: payload.teacher_id,
      adminId: payload.admin_id,
      fullName: payload.full_name,
    };
  }

  private isTokenExpired(payload: JwtPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private redirectByRole(role: User['role']): void {
    switch (role) {
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'super_admin':
        this.router.navigate(['/super-admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
  private handleAuthSuccess(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);

    const payload = this.decodeJwt(token);
    console.log('JWT payload:', payload); // <-- debug

    if (this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    const user = this.mapJwtToUser(payload);
    if (user.tenantId) {
      localStorage.setItem('tenantId', user.tenantId);
    }
    if (user.id) {
      localStorage.setItem('eduverse_user_id', user.id);
    }
    if (user.studentId) {
      localStorage.setItem('eduverse_student_id', user.studentId);
    }
    console.log('Mapped user:', user); // <-- debug
    this.currentUserSubject.next(user);

    console.log('Redirecting to dashboard for role:', user.role);
    this.redirectByRole(user.role);
  }
}
