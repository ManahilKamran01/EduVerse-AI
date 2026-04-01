import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer?: string;
    correctAnswer?: string;
}

export interface Quiz {
    id: string;
    courseId: string;
    lessonId?: string;
    topic?: string;
    quizNumber?: number;
    description?: string;
    questions: QuizQuestion[];
    totalMarks?: number;
    timeLimitMinutes?: number;
    generatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    private baseUrl = `${API_BASE_URL}/quizzes`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getQuizById(quizId: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/${quizId}`, {
            headers: this.getHeaders()
        });
    }

    getMyQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(`${this.baseUrl}/student/me`, {
            headers: this.getHeaders()
        }).pipe(
            map((quizzes) =>
                quizzes.map((quiz) => ({
                    ...quiz,
                    description: quiz.description || quiz.topic,
                    totalMarks: quiz.totalMarks ?? quiz.questions?.length ?? 0,
                }))
            )
        );
    }
}
