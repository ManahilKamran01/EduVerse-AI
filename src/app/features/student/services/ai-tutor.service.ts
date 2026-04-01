import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AiTutorService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  sendMessage(message: string, courseId: string, lessonId?: string): Observable<any> {
    return this.http.post(
      ENDPOINTS.AI_TUTOR.CHAT,
      { message, courseId, lessonId },
      { headers: this.getHeaders() }
    );
  }

  clearSession(courseId: string): Observable<any> {
    return this.http.delete(ENDPOINTS.AI_TUTOR.SESSION(courseId), {
      headers: this.getHeaders(),
    });
  }
}
