import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { QuizTakingModalComponent } from '../../components/quiz-taking-modal/quiz-taking-modal.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';

// Services
import { QuizService } from '../../../teacher/services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import {
  StudentProfileService,
  StudentProfile,
} from '../../services/student-profile.service';
import { ToastService } from '../../../../shared/services/toast.service';

// Models
import { Quiz } from '../../../../shared/models/quiz.model';
import {
  QuizSubmission,
  QuizSubmissionCreate,
  AnswerItem,
} from '../../../../shared/models/quiz-submission.model';

/**
 * StudentQuizzesComponent
 * -----------------------
 * Page for students to view available quizzes and take them.
 * Connected to backend via QuizService and QuizSubmissionService.
 *
 * Flow:
 * 1. On init, fetch student profile to get studentId and tenantId
 * 2. Fetch available quizzes for the tenant
 * 3. Fetch student's previous submissions to mark completed quizzes
 * 4. When student submits, call submission API for auto-grading
 */
@Component({
  selector: 'app-student-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, QuizTakingModalComponent, FiltersComponent],
  templateUrl: './student-quizzes.component.html',
  styleUrls: ['./student-quizzes.component.css'],
})
export class StudentQuizzesComponent implements OnInit {
  // ========================
  // Component State
  // ========================
  quizzes: any[] = []; // Quizzes with submission status
  filteredQuizzes: any[] = []; // Filtered list for display
  submissions: QuizSubmission[] = []; // Student's previous submissions
  showModal = false;
  selectedQuiz: any = null;
  viewOnly = false;
  today = new Date();
  loading = false;
  error: string | null = null;

  // Filter configuration
  filterDropdowns: { key: string; label: string; options: string[] }[] = [];
  searchText = '';
  selectedCourseFilter = '';
  selectedStatusFilter = '';
  selectedDueDateFilter = '';

  // Student context
  studentProfile: StudentProfile | null = null;
  studentId: string = '';
  tenantId: string = '';

  constructor(
    private quizService: QuizService,
    private submissionService: QuizSubmissionService,
    private studentProfileService: StudentProfileService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadStudentContext();
  }

  // ========================
  // INITIALIZATION
  // ========================

  /**
   * Step 1: Load student profile to get studentId and tenantId.
   */
  loadStudentContext(): void {
    this.loading = true;
    this.error = null;

    this.studentProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.studentProfile = profile;
        this.studentId = profile.id; // Student's MongoDB _id
        this.tenantId = profile.tenantId || ''; // tenantId is at root level, not in user

        console.log('Student profile loaded:', {
          studentId: this.studentId,
          tenantId: this.tenantId,
        });

        // Load quizzes and submissions
        this.loadQuizzesAndSubmissions();
      },
      error: (err) => {
        console.error('Failed to load student profile:', err);
        this.error = 'Failed to load profile. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Step 2: Load quizzes and student's submissions in parallel.
   */
  loadQuizzesAndSubmissions(): void {
    // Load quizzes
    this.quizService.getStudentAvailableQuizzes().subscribe({
      next: (quizzes) => {
        console.log('Quizzes loaded:', quizzes.length);

        // Now load submissions to merge status
        this.loadSubmissions(quizzes);
      },
      error: (err) => {
        console.error('Failed to load quizzes:', err);
        this.error = 'Failed to load quizzes. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Step 3: Load student's submissions and merge with quiz data.
   */
  loadSubmissions(quizzes: any[]): void {
    this.submissionService.getSubmissionsByStudent(this.studentId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        console.log('Submissions loaded:', submissions.length);

        // Merge quizzes with submission data
        this.quizzes = quizzes.map((quiz) =>
          this.transformQuizForDisplay(quiz),
        );
        this.filteredQuizzes = this.quizzes; // Initialize filtered list

        // Set up course filter options (unique course names)
        const courseNames = [...new Set(quizzes.map((q) => q.courseName || q.topic || 'Adaptive Quiz'))];
        this.filterDropdowns = [
          {
            key: 'course',
            label: 'Course',
            options: courseNames,
          },
          {
            key: 'status',
            label: 'Status',
            options: ['Completed', 'Pending'],
          },
          {
            key: 'dueDate',
            label: 'Due Date',
            options: ['Upcoming', 'Due Passed'],
          },
        ];

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load submissions:', err);
        // Still show quizzes even if submissions fail
        this.quizzes = quizzes.map((quiz) =>
          this.transformQuizForDisplay(quiz),
        );
        this.filteredQuizzes = this.quizzes;

        // Set up course filter options
        const courseNames = [...new Set(quizzes.map((q) => q.courseName || q.topic || 'Adaptive Quiz'))];
        this.filterDropdowns = [
          {
            key: 'course',
            label: 'Course',
            options: courseNames,
          },
          {
            key: 'status',
            label: 'Status',
            options: ['Completed', 'Pending'],
          },
          {
            key: 'dueDate',
            label: 'Due Date',
            options: ['Upcoming', 'Due Passed'],
          },
        ];

        this.loading = false;
      },
    });
  }

  /**
   * Transform backend Quiz to display format with submission status.
   */
  transformQuizForDisplay(quiz: any): any {
    // Find if student has already submitted this quiz
    const submission = this.submissions.find((s) => s.quizId === quiz.id);
    const isAiQuiz = quiz.quizNumber === undefined || quiz.quizNumber === null;
    const courseLabel = quiz.courseName || quiz.topic || 'Adaptive Quiz';
    const dueDate = quiz.dueDate || quiz.generatedAt || new Date().toISOString();
    const totalMarks = quiz.totalMarks || quiz.questions.length;

    return {
      id: quiz.id,
      quizNo: isAiQuiz ? 'AI' : quiz.quizNumber.toString().padStart(2, '0'),
      course: courseLabel,
      courseId: quiz.courseId,
      dueDate: new Date(dueDate),
      description: quiz.description || quiz.topic || '',
      totalMarks,
      questions: quiz.questions.map((q: any, index: number) => ({
        index,
        statement: q.question,
        options: q.options,
        correctAnswer: q.answer || q.correctAnswer,
        selectedAnswer: submission
          ? this.getSelectedAnswer(submission, index)
          : '',
      })),
      // Submission status
      status: submission ? 'Completed' : 'Pending',
      submissionId: submission?.id,
      score: submission?.obtainedMarks || 0,
      percentage: submission?.percentage || 0,
      totalQuestions: quiz.questions.length,
    };
  }

  /**
   * Get selected answer from submission for a specific question.
   */
  getSelectedAnswer(submission: QuizSubmission, questionIndex: number): string {
    const answer = submission.answers.find(
      (a) => a.questionIndex === questionIndex,
    );
    return answer?.selected || '';
  }

  // ========================
  // QUIZ INTERACTION
  // ========================

  isDuePassed(quiz: any): boolean {
    return new Date(quiz.dueDate) < this.today;
  }

  /**
   * Handle filter changes from FiltersComponent.
   */
  onFiltersChange(filters: { [key: string]: string }): void {
    this.searchText = filters['search'] || '';
    this.selectedCourseFilter = filters['course'] || '';
    this.selectedStatusFilter = filters['status'] || '';
    this.selectedDueDateFilter = filters['dueDate'] || '';
    this.applyFilters();
  }

  /**
   * Apply search and course filters to quizzes.
   */
  applyFilters(): void {
    let result = [...this.quizzes];
    const today = new Date();

    // Filter by course name
    if (this.selectedCourseFilter) {
      result = result.filter(
        (q) => q.course === this.selectedCourseFilter
      );
    }

    // Filter by status (Completed/Pending)
    if (this.selectedStatusFilter) {
      result = result.filter(
        (q) => q.status === this.selectedStatusFilter
      );
    }

    // Filter by due date (Upcoming/Due Passed)
    if (this.selectedDueDateFilter) {
      if (this.selectedDueDateFilter === 'Upcoming') {
        // Upcoming should only show pending quizzes with future due dates
        result = result.filter((q) => new Date(q.dueDate) >= today && q.status !== 'Completed');
      } else if (this.selectedDueDateFilter === 'Due Passed') {
        result = result.filter((q) => new Date(q.dueDate) < today);
      }
    }

    // Filter by search text (quiz number or description)
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      result = result.filter(
        (q) =>
          q.quizNo.toString().includes(searchLower) ||
          (q.description && q.description.toLowerCase().includes(searchLower)) ||
          q.course.toLowerCase().includes(searchLower)
      );
    }

    this.filteredQuizzes = result;
  }

  /**
   * Get CSS class for score color based on percentage.
   * Green for >= 70%, Yellow for >= 50%, Red for < 50%
   */
  getScoreColorClass(percentage: number): string {
    if (percentage >= 70) {
      return 'text-green-600';
    } else if (percentage >= 50) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  openQuiz(quiz: any): void {
    // Don't allow if due date passed and not completed
    if (this.isDuePassed(quiz) && quiz.status !== 'Completed') {
      this.toastService.warning('Due date has passed. You cannot attempt this quiz.');
      return;
    }

    this.selectedQuiz = quiz;
    this.viewOnly = quiz.status === 'Completed';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedQuiz = null;
  }

  /**
   * Handle quiz completion from modal.
   * Submits answers to backend for auto-grading.
   */
  completeQuiz(quizResult: any): void {
    // Build submission payload
    const answers: AnswerItem[] = quizResult.questions.map(
      (q: any, index: number) => ({
        questionIndex: index,
        selected: q.selectedAnswer,
      }),
    );

    const payload: QuizSubmissionCreate = {
      studentId: this.studentId,
      quizId: quizResult.id,
      courseId: this.selectedQuiz.courseId,
      tenantId: this.tenantId,
      answers,
    };

    console.log('Submitting quiz:', payload);

    this.submissionService.submitQuiz(payload).subscribe({
      next: (submission) => {
        console.log('Quiz submitted successfully:', submission);

        // Update local quiz state
        const idx = this.quizzes.findIndex((q) => q.id === quizResult.id);
        if (idx > -1) {
          this.quizzes[idx] = {
            ...this.quizzes[idx],
            status: 'Completed',
            submissionId: submission.id,
            score: submission.obtainedMarks || 0,
            percentage: submission.percentage || 0,
          };
          // Re-apply filters to update the display immediately
          this.applyFilters();
        }

        this.closeModal();
        this.toastService.success(
          `Quiz submitted! Score: ${submission.obtainedMarks}/${this.selectedQuiz.totalQuestions} (${submission.percentage}%)`,
        );
      },
      error: (err) => {
        console.error('Failed to submit quiz:', err);
        if (err.error?.detail === 'Student already submitted this quiz.') {
          this.toastService.warning('You have already submitted this quiz.');
          // Reload to get latest data
          this.loadQuizzesAndSubmissions();
        } else {
          this.toastService.error(
            err.error?.detail || 'Failed to submit quiz. Please try again.',
          );
        }
        this.closeModal();
      },
    });
  }
}
