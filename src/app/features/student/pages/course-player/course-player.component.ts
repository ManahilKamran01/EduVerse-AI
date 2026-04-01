import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { QuizService, Quiz } from '../../services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { AiTutorService } from '../../services/ai-tutor.service';
import { AdaptiveLearningService } from '../../services/adaptive-learning.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { MarkdownModule } from 'ngx-markdown';

interface ChatMessage {
    sender: 'AI' | 'Student';
    text: string;
    time: Date;
}

@Component({
    selector: 'app-course-player',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, MarkdownModule],
    templateUrl: './course-player.component.html',
    styleUrls: ['./course-player.component.css']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
    courseId: string = '';
    course: BackendCourse | null = null;
    progress: CourseProgress | null = null;
    loading: boolean = true;
    activeLesson: any = null;
    activeModuleIndex: number = 0;
    allLessons: any[] = [];
    videoUrl: SafeResourceUrl | null = null;

    // Quiz State
    activeQuiz: Quiz | null = null;
    quizAnswers: string[] = [];
    quizScore: number = 0;
    quizSubmitted: boolean = false;
    loadingQuiz: boolean = false;
    submittingQuiz: boolean = false;

    // Sidebar visibility
    isSidebarOpen: boolean = true;

    // Notes
    userNotes: string = '';
    isSavingNotes: boolean = false;

    // Chat
    chatInput: string = '';
    chatMessages: ChatMessage[] = [
        { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
    ];
    isSendingChat: boolean = false;

    // Adaptive Flow
    isGeneratingAiLesson: boolean = false;
    isWaitingForAdaptiveLesson: boolean = false;
    aiGeneratedLessons: any[] = [];
    studentQuizzes: Quiz[] = [];
    activeAdaptiveLesson: any = null;
    private generatingBaseLessonForId: string | null = null;
    private pendingAdaptiveLessonId: string | null = null;
    private adaptiveLessonPollToken: number = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private courseService: CourseService,
        private authService: AuthService,
        private progressService: StudentProgressService,
        private quizService: QuizService,
        private submissionService: QuizSubmissionService,
        private aiTutorService: AiTutorService,
        private adaptiveService: AdaptiveLearningService,
        private toastService: ToastService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.courseId = params.get('id') || '';
            if (this.courseId) {
                this.loadCourseAndProgress();
            }
        });
    }

    ngOnDestroy() { }

    loadCourseAndProgress() {
        const tenantId = this.authService.getTenantId() || '';

        // Load local notes
        const savedNotes = localStorage.getItem(`notes_${this.courseId}`);
        if (savedNotes) this.userNotes = savedNotes;

        this.courseService.getCourseById(this.courseId, tenantId).subscribe({
            next: (course) => {
                this.course = course;
                this.flattenLessons();
                this.loadProgress(tenantId);
                this.loadAiGeneratedLessons();
                this.loadStudentQuizzes();
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    flattenLessons() {
        this.allLessons = [];
        if (!this.course?.modules) return;
        this.course.modules.forEach((module, mIdx) => {
            if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                    this.allLessons.push({ ...lesson, moduleIndex: mIdx });
                });
            }
        });
    }

    loadProgress(tenantId: string) {
        this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
            next: (progress) => {
                this.progress = progress;
                if (!this.activeLesson) {
                    const nextLesson =
                        this.allLessons.find((lesson) => !this.isLessonCompleted(this.getLessonId(lesson))) ||
                        this.allLessons[0];
                    if (nextLesson) {
                        this.selectLesson(nextLesson, nextLesson.moduleIndex);
                    }
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading progress', err);
                this.loading = false;
            }
        });
    }

    loadAiGeneratedLessons() {
        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: any[]) => {
                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();
                if (this.activeAdaptiveLesson && this.pendingAdaptiveLessonId === this.getLessonId(this.activeLesson)) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                }
            },
            error: (err) => console.error('Error loading AI lessons', err)
        });
    }

    loadStudentQuizzes(showQuizForLessonId?: string, attempt: number = 0) {
        this.quizService.getMyQuizzes().subscribe({
            next: (quizzes) => {
                this.studentQuizzes = quizzes.filter((quiz) => quiz.courseId === this.courseId);
                const currentLessonId = this.activeLesson ? this.getLessonId(this.activeLesson) : null;
                if (currentLessonId && !showQuizForLessonId) {
                    const generatedQuiz = this.findGeneratedQuizForLesson(currentLessonId);
                    if (generatedQuiz && !this.activeQuiz) {
                        this.applyQuiz(generatedQuiz);
                        this.toastService.success('Your lesson quiz is ready.');
                    }
                }
                if (showQuizForLessonId) {
                    const generatedQuiz = this.findGeneratedQuizForLesson(showQuizForLessonId);
                    if (generatedQuiz) {
                        this.applyQuiz(generatedQuiz);
                        this.toastService.success('Your lesson quiz is ready.');
                    } else if (attempt < 10) {
                        window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 2500);
                    } else {
                        this.loadingQuiz = false;
                        this.toastService.warning('Quiz generation is taking longer than expected. Please refresh in a few moments.');
                    }
                }
            },
            error: (err) => {
                console.error('Error loading student quizzes', err);
                if (showQuizForLessonId && attempt < 10) {
                    window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 2500);
                } else {
                    this.loadingQuiz = false;
                }
            }
        });
    }

    selectLesson(lesson: any, moduleIndex: number) {
        this.activeLesson = lesson;
        this.activeModuleIndex = moduleIndex;
        this.quizSubmitted = false;
        this.activeQuiz = null;
        this.quizAnswers = [];
        this.loadingQuiz = true;
        this.syncActiveAdaptiveLesson();
        this.ensureBaseLessonContent();
        this.ensureAdaptiveLessonReady();

        console.log('Selected Lesson:', lesson.title, 'Type:', lesson.type);

        // Handle Video URL
        if (lesson.type === 'video' && lesson.content) {
            this.videoUrl = this.getSafeVideoUrl(lesson.content);
        } else {
            this.videoUrl = null;
        }

        // Handle Quiz
        this.loadQuizForLesson(lesson);

        // Auto-scroll to top of content
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.scrollTo(0, 0);
    }

    loadQuiz(quizId: string) {
        this.loadingQuiz = true;
        this.quizService.getQuizById(quizId).subscribe({
            next: (quiz) => {
                this.applyQuiz(quiz);
            },
            error: (err) => {
                console.error('Error loading quiz:', err);
                this.loadingQuiz = false;
            }
        });
    }

    loadQuizForLesson(lesson: any) {
        const lessonId = this.getLessonId(lesson);
        let quizId = null;

        if (lesson.type === 'quiz' && lesson.content) {
            quizId = lesson.content;
        } else {
            const generatedQuiz = this.findGeneratedQuizForLesson(lessonId);
            if (generatedQuiz) {
                quizId = generatedQuiz.id;
            }
        }

        if (quizId) {
            this.loadQuiz(quizId);
        } else {
            this.loadingQuiz = false;
        }
    }

    submitQuiz() {
        if (!this.activeQuiz) return;
        this.submittingQuiz = true;
        this.loadingQuiz = true;

        const payload = {
            quizId: this.activeQuiz.id,
            courseId: this.courseId,
            answers: this.quizAnswers.map((selected, questionIndex) => ({
                questionIndex,
                selected,
            })),
        };

        this.submissionService.submitQuiz(payload as any).subscribe({
            next: (submission: any) => {
                this.quizScore = submission.percentage || 0;
                this.quizSubmitted = true;
                this.submittingQuiz = false;
                this.loadingQuiz = false;
                const nextLesson = this.getNextLearningLesson(this.activeLesson);
                this.pendingAdaptiveLessonId = nextLesson ? this.getLessonId(nextLesson) : null;

                if (
                    this.activeLesson?.type === 'quiz' &&
                    this.quizScore >= 70 &&
                    !this.isLessonCompleted(this.getLessonId(this.activeLesson))
                ) {
                    this.markComplete();
                } else {
                    this.scheduleAdaptiveRefresh();
                }

                this.toastService.success(`Quiz submitted successfully. Score: ${this.quizScore}%`);
            },
            error: (err) => {
                console.error('Error submitting quiz:', err);
                this.submittingQuiz = false;
                this.loadingQuiz = false;
                this.toastService.error(err?.error?.detail || 'Could not submit quiz right now.');
            }
        });
    }

    getSafeVideoUrl(url: string): SafeResourceUrl {
        if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
        
        let embedUrl = url;
        
        // Robust YouTube matching
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (ytMatch && ytMatch[1]) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        
        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Helper to compare IDs safely
    lessonsMatch(l1: any, l2: any): boolean {
        if (!l1 || !l2) return false;
        const id1 = l1.id || l1._id;
        const id2 = l2.id || l2._id;
        return id1 === id2;
    }

    getLessonId(lesson: any): string {
        return lesson?.id || lesson?._id || '';
    }

    syncActiveAdaptiveLesson() {
        if (!this.activeLesson) {
            this.activeAdaptiveLesson = null;
            return;
        }
        const lessonId = this.getLessonId(this.activeLesson);
        const matchingLessons = this.aiGeneratedLessons.filter(
            (lesson) => lesson.lessonId === lessonId || lesson.sourceTopic === this.activeLesson?.title
        );

        if (this.isFirstCourseLesson(this.activeLesson)) {
            this.activeAdaptiveLesson =
                matchingLessons.find((lesson) => lesson.generationType === 'base') ||
                matchingLessons[0] ||
                null;
            return;
        }

        this.activeAdaptiveLesson =
            matchingLessons.find((lesson) => lesson.generationType !== 'base') ||
            matchingLessons[0] ||
            null;
    }

    get personalizedLessons(): any[] {
        return this.aiGeneratedLessons.filter((lesson) => lesson?.generationType !== 'base');
    }

    getNextLearningLesson(afterLesson: any): any | null {
        const currentIndex = this.allLessons.findIndex((lesson) => this.lessonsMatch(lesson, afterLesson));
        if (currentIndex === -1) {
            return null;
        }

        for (let index = currentIndex + 1; index < this.allLessons.length; index += 1) {
            const candidate = this.allLessons[index];
            if (candidate?.type !== 'quiz') {
                return candidate;
            }
        }

        return null;
    }

    findGeneratedQuizForLesson(lessonId: string): Quiz | null {
        return (
            this.studentQuizzes.find((quiz) => quiz.lessonId === lessonId && quiz.courseId === this.courseId) ||
            null
        );
    }

    applyQuiz(quiz: Quiz) {
        this.activeQuiz = quiz;
        this.quizAnswers = new Array(quiz.questions.length).fill('');
        this.loadingQuiz = false;
    }

    openPersonalizedLesson(aiLesson: any) {
        const matchingLesson =
            this.allLessons.find((lesson) => this.getLessonId(lesson) === aiLesson.lessonId) ||
            this.allLessons.find((lesson) => lesson.title === aiLesson.sourceTopic);

        if (!matchingLesson) {
            this.toastService.warning('This personalized lesson is not linked to a course lesson yet.');
            return;
        }

        this.selectLesson(matchingLesson, matchingLesson.moduleIndex);
        this.activeAdaptiveLesson = aiLesson;
    }

    isFirstCourseLesson(lesson: any): boolean {
        return this.allLessons.length > 0 && this.lessonsMatch(this.allLessons[0], lesson);
    }

    getTeacherLessonSource(lesson: any): string {
        return String(lesson?.description || lesson?.content || '').trim();
    }

    shouldGenerateBaseLesson(lesson: any): boolean {
        const textLessonTypes = ['document', 'reading', 'file', 'assignment'];
        return Boolean(
            lesson &&
            this.isFirstCourseLesson(lesson) &&
            (!lesson.type || textLessonTypes.includes(lesson.type)) &&
            this.getTeacherLessonSource(lesson)
        );
    }

    upsertAiGeneratedLesson(generatedLesson: any) {
        this.aiGeneratedLessons = [
            generatedLesson,
            ...this.aiGeneratedLessons.filter((lesson) =>
                lesson.id !== generatedLesson.id &&
                !(
                    lesson.lessonId === generatedLesson.lessonId &&
                    lesson.generationType === generatedLesson.generationType
                )
            ),
        ];
    }

    ensureBaseLessonContent() {
        if (!this.activeLesson || !this.shouldGenerateBaseLesson(this.activeLesson)) {
            return;
        }

        const lessonId = this.getLessonId(this.activeLesson);
        if (!lessonId || this.activeAdaptiveLesson || this.generatingBaseLessonForId === lessonId) {
            return;
        }

        const sourceContent = this.getTeacherLessonSource(this.activeLesson);
        if (!sourceContent) {
            return;
        }

        this.generatingBaseLessonForId = lessonId;
        this.isGeneratingAiLesson = true;

        this.adaptiveService.generateBaseLesson(
            this.courseId,
            lessonId,
            this.activeLesson.title || 'Lesson 1',
            sourceContent
        ).subscribe({
            next: (generatedLesson) => {
                this.upsertAiGeneratedLesson(generatedLesson);
                this.syncActiveAdaptiveLesson();
                this.generatingBaseLessonForId = null;
                this.isGeneratingAiLesson = false;
            },
            error: (err) => {
                console.error('Error generating base lesson:', err);
                this.generatingBaseLessonForId = null;
                this.isGeneratingAiLesson = false;
                this.toastService.warning('Showing the teacher lesson content for now. AI lesson generation can be retried shortly.');
            }
        });
    }

    shouldWaitForAdaptiveLesson(lesson: any): boolean {
        const textLessonTypes = ['document', 'reading', 'file', 'assignment'];
        const lessonId = this.getLessonId(lesson);

        return Boolean(
            lesson &&
            lessonId &&
            this.pendingAdaptiveLessonId === lessonId &&
            !this.activeAdaptiveLesson &&
            !this.isFirstCourseLesson(lesson) &&
            (!lesson.type || textLessonTypes.includes(lesson.type))
        );
    }

    ensureAdaptiveLessonReady(attempt: number = 0, pollToken?: number) {
        if (!this.activeLesson || !this.shouldWaitForAdaptiveLesson(this.activeLesson)) {
            this.isWaitingForAdaptiveLesson = false;
            return;
        }

        const lessonId = this.getLessonId(this.activeLesson);

        if (pollToken === undefined) {
            this.adaptiveLessonPollToken += 1;
            pollToken = this.adaptiveLessonPollToken;
        }

        this.isWaitingForAdaptiveLesson = true;

        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: any[]) => {
                if (pollToken !== this.adaptiveLessonPollToken) {
                    return;
                }

                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();

                if (this.activeAdaptiveLesson && this.getLessonId(this.activeLesson) === lessonId) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                    return;
                }

                if (attempt < 12 && this.pendingAdaptiveLessonId === lessonId && this.getLessonId(this.activeLesson) === lessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 2500);
                    return;
                }

                this.isWaitingForAdaptiveLesson = false;
                if (this.pendingAdaptiveLessonId === lessonId) {
                    this.toastService.warning('Personalized lesson is taking longer than expected. Please refresh in a few moments.');
                }
            },
            error: (err) => {
                console.error('Error waiting for adaptive lesson', err);

                if (pollToken !== this.adaptiveLessonPollToken) {
                    return;
                }

                if (attempt < 12 && this.pendingAdaptiveLessonId === lessonId && this.getLessonId(this.activeLesson) === lessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 2500);
                    return;
                }

                this.isWaitingForAdaptiveLesson = false;
            }
        });
    }

    scheduleAdaptiveRefresh() {
        window.setTimeout(() => this.loadAiGeneratedLessons(), 3000);
        window.setTimeout(() => this.loadAiGeneratedLessons(), 18000);
        window.setTimeout(() => this.loadStudentQuizzes(), 3000);
    }

    getDisplayedLessonTitle(): string {
        return this.activeAdaptiveLesson?.title || this.activeLesson?.title || '';
    }

    isLessonCompleted(lessonId: string): boolean {
        return this.progress?.completedLessons.includes(lessonId) || false;
    }

    markComplete() {
        if (!this.activeLesson) return;
        const lessonId = this.activeLesson.id || this.activeLesson._id;
        const tenantId = this.authService.getTenantId() || '';
        
        if (!lessonId) return;

        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: (updatedProgress) => {
                this.progress = updatedProgress;

                if (this.activeLesson.type !== 'quiz') {
                    this.toastService.info('Preparing your lesson quiz...');
                    this.loadingQuiz = true;
                    this.quizSubmitted = false;
                    this.loadStudentQuizzes(lessonId);
                }

                this.scheduleAdaptiveRefresh();
            },
            error: (err) => console.error('Error marking completion', err)
        });
    }

    saveNotes() {
        this.isSavingNotes = true;
        localStorage.setItem(`notes_${this.courseId}`, this.userNotes);
        setTimeout(() => {
            this.isSavingNotes = false;
        }, 800);
    }

    sendChatMessage() {
        if (!this.chatInput.trim() || this.isSendingChat) return;

        const userMsg: ChatMessage = { sender: 'Student', text: this.chatInput, time: new Date() };
        this.chatMessages.push(userMsg);

        const message = this.chatInput;
        this.chatInput = '';
        this.isSendingChat = true;

        const lessonId = this.activeLesson?.id || this.activeLesson?._id;

        this.aiTutorService.sendMessage(message, this.courseId, lessonId).subscribe({
            next: (response: any) => {
                console.log('AI Tutor Response:', response);
                this.chatMessages.push({
                    sender: 'AI',
                    text: response.response || response.reply || response.message || response.content || "I couldn't generate a response.",
                    time: new Date()
                });
                this.isSendingChat = false;
            },
            error: (err: any) => {
                console.error('AI Tutor error:', err);
                this.chatMessages.push({
                    sender: 'AI',
                    text: 'Sorry, I encountered an error. Please try again later.',
                    time: new Date()
                });
                this.isSendingChat = false;
            }
        });
    }

    nextLesson() {
        if (this.isNextLessonLocked()) {
            return;
        }
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex !== -1 && currentIndex < this.allLessons.length - 1) {
            const next = this.allLessons[currentIndex + 1];
            this.selectLesson(next, next.moduleIndex);
        }
    }

    previousLesson() {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex > 0) {
            const prev = this.allLessons[currentIndex - 1];
            this.selectLesson(prev, prev.moduleIndex);
        }
    }

    hasNextLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex !== -1 && currentIndex < this.allLessons.length - 1;
    }

    isNextLessonLocked(): boolean {
        return this.loadingQuiz || this.submittingQuiz || Boolean(this.activeQuiz && !(this.quizSubmitted && this.quizScore >= 70));
    }

    hasPreviousLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex > 0;
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    goBack() {
        this.router.navigate(['/student/courses']);
    }
}
