import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [HeaderComponent, CommonModule, DataTableComponent],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css'],
})
export class StudentDetailsComponent implements OnInit {
  studentId: number | null = null;
  student: any = null;

  quizColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];

  assignmentColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStudentData();
  }

  goBack() {
    this.router.navigate(['/teacher/trackstudent']);
  }

  loadStudentData() {
    const allStudents: any[] = [
      {
        id: 1,
        name: 'John Doe',
        course: 'Introduction to Algebra',
        quizzes: [
          { title: 'Quiz 1', score: 9, total: 10 },
          { title: 'Quiz 2', score: 8, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 18, total: 20 },
          { title: 'Assignment 2', score: 20, total: 20 },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        course: 'World History',
        quizzes: [
          { title: 'Quiz 1', score: 6, total: 10 },
          { title: 'Quiz 2', score: 5, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 14, total: 20 },
          { title: 'Assignment 2', score: 15, total: 20 },
        ],
      },
      {
        id: 3,
        name: 'Mike Johnson',
        course: 'Physics 101',
        quizzes: [
          { title: 'Quiz 1', score: 10, total: 10 },
          { title: 'Quiz 2', score: 9, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 20, total: 20 },
          { title: 'Assignment 2', score: 19, total: 20 },
        ],
      },
      {
        id: 4,
        name: 'Emily Davis',
        course: 'Introduction to Algebra',
        quizzes: [
          { title: 'Quiz 1', score: 4, total: 10 },
          { title: 'Quiz 2', score: 5, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 10, total: 20 },
          { title: 'Assignment 2', score: 8, total: 20 },
        ],
      },
    ];

    const selected = allStudents.find((s) => s.id === this.studentId);

    if (selected) {
      // Add scoreDisplay
      selected.quizzes = selected.quizzes.map((q: any) => ({
        ...q,
        scoreDisplay: `${q.score}/${q.total}`,
      }));
      selected.assignments = selected.assignments.map((a: any) => ({
        ...a,
        scoreDisplay: `${a.score}/${a.total}`,
      }));

      const totalQuizScore = selected.quizzes.reduce((sum: number, q: any) => sum + q.score, 0);
      const totalQuizMax = selected.quizzes.reduce((sum: number, q: any) => sum + q.total, 0);

      const totalAssignmentScore = selected.assignments.reduce(
        (sum: number, a: any) => sum + a.score,
        0
      );
      const totalAssignmentMax = selected.assignments.reduce(
        (sum: number, a: any) => sum + a.total,
        0
      );

      selected.quizzes.push({
        title: 'Total',
        scoreDisplay: `${totalQuizScore}/${totalQuizMax}`,
      });
      selected.assignments.push({
        title: 'Total',
        scoreDisplay: `${totalAssignmentScore}/${totalAssignmentMax}`,
      });

      (selected as any).quizPercentage = totalQuizMax
        ? Math.round((totalQuizScore / totalQuizMax) * 100)
        : 0;
      (selected as any).assignmentPercentage = totalAssignmentMax
        ? Math.round((totalAssignmentScore / totalAssignmentMax) * 100)
        : 0;
      const overallScore = totalQuizScore + totalAssignmentScore;
      const overallMax = totalQuizMax + totalAssignmentMax;
      (selected as any).percentage = overallMax ? Math.round((overallScore / overallMax) * 100) : 0;
    }

    this.student = selected;
  }

  getProgressColor(value: number) {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  }
}
