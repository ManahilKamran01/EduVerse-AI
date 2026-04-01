import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ENDPOINTS } from '../../../core/constants/api.constants';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdaptiveLearningService {
    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getAccessToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    private getStudentId(): string {
        const user = this.authService.getUser();
        return user?.studentId || '';
    }

    generateAiLesson(courseId: string, quizId: string | null, topic: string, weakAreas?: string[], scorePercentage?: number): Observable<any> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_LESSON}?student_id=${studentId}`;
        
        return this.http.post<any>(
            url,
            { 
                courseId, 
                quizId, 
                topic,
                scorePercentage: scorePercentage !== undefined ? scorePercentage : 100,
                weakAreas: (weakAreas || []).join(', ')
            },
            { headers: this.getHeaders() }
        );
    }

    generateBaseLesson(courseId: string, lessonId: string, topic: string, sourceContent: string): Observable<any> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_BASE_LESSON}?student_id=${studentId}`;

        return this.http.post<any>(
            url,
            {
                courseId,
                lessonId,
                topic,
                sourceContent
            },
            { headers: this.getHeaders() }
        );
    }

    getStudentLessons(courseId: string): Observable<any[]> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATED_LESSONS(studentId)}?course_id=${courseId}`;
        return this.http.get<any[]>(url, { headers: this.getHeaders() });
    }

    getLatestClassification(courseId: string): Observable<any> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.CLASSIFICATION(studentId)}?course_id=${courseId}`;
        return this.http.get<any>(url, { headers: this.getHeaders() });
    }

    generateQuiz(courseId: string, topic: string): Observable<any> {
        const studentId = this.getStudentId();
        const url = `${ENDPOINTS.ADAPTIVE.GENERATE_QUIZ}?student_id=${studentId}`;
        return this.http.post<any>(
            url,
            { courseId, topic },
            { headers: this.getHeaders() }
        );
    }
}
