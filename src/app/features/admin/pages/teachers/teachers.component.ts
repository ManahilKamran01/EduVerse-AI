import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TableColumn, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { catchError, of } from 'rxjs';

interface FilterOptions {
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent, ButtonComponent, HttpClientModule],
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.css']
})
export class TeachersComponent implements OnInit {
  currentPage = 1;
  teachers: any[] = [];
  filteredTeachers: any[] = [];
  backendUrl = 'http://127.0.0.1:8000/admin/teachers';

  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar' },
    { key: 'courses', label: 'Courses', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
      },
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTeachers();
  }

  fetchTeachers(): void {
    this.http.get<{ total: number; teachers: any[] }>(this.backendUrl)
      .pipe(
        catchError(err => {
          console.error(err);
          alert('Failed to fetch teachers');
          return of({ teachers: [] });
        })
      )
      .subscribe(res => {
        this.teachers = res.teachers.map(t => ({
          ...t,
          id: t.id,                           // Already mapped from backend
          name: t.name || t.fullName || '',
          avatar: t.name ? t.name.split(' ').map((n: string) => n[0]).join('') : '',
          courses: t.assignedCourses?.length || 0,
          students: t.totalStudents || 0,
          role: t.role || 'Teacher',
          status: t.status === 'Active' ? 'Active' : 'Inactive'
        }));
        this.filteredTeachers = [...this.teachers];
      });
  }

  onAddTeacher(): void {
    console.log('Add teacher clicked');
    // Implement modal or navigation to add page
  }
onEditTeacher(teacher: any): void {
  const updatedName = prompt('Update teacher name', teacher.name);
  if (!updatedName) return;

  const payload = { fullName: updatedName };

  this.http.patch(`${this.backendUrl}/${teacher.id}`, payload)
    .pipe(
      catchError(err => {
        console.error(err);
        alert('Failed to update teacher');
        return of(null);
      })
    )
    .subscribe((res: any) => {
      if (res) {
        // Create a NEW object to trigger Angular change detection
        const updatedTeacher = {
          id: res.id,
          name: res.name,
          email: res.email,
          assignedCourses: res.assignedCourses,
          totalStudents: res.totalStudents,
          role: res.role,
          status: res.status,
          avatar: res.name ? res.name.split(' ').map((n: string) => n[0]).join('') : ''
        };

        // Replace the teacher in both arrays
        this.teachers = this.teachers.map(t => t.id === teacher.id ? updatedTeacher : t);
        this.filteredTeachers = this.filteredTeachers.map(t => t.id === teacher.id ? updatedTeacher : t);
      }
    });
}


  onDeleteTeacher(teacher: any): void {
    if (!confirm(`Are you sure you want to delete "${teacher.name}"?`)) return;

    this.http.delete(`${this.backendUrl}/${teacher.id}`)
      .pipe(
        catchError(err => {
          console.error(err);
          alert('Failed to delete teacher');
          return of(null);
        })
      )
      .subscribe(() => {
        this.teachers = this.teachers.filter(t => t.id !== teacher.id);
        this.filteredTeachers = this.filteredTeachers.filter(t => t.id !== teacher.id);
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onFiltersChange(filters: FilterOptions): void {
    this.currentPage = 1;
    const search = (filters['search'] || '').toLowerCase();
    const statusFilter = filters['status'] || '';

    this.filteredTeachers = this.teachers.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search) || t.email.toLowerCase().includes(search);
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }
}
