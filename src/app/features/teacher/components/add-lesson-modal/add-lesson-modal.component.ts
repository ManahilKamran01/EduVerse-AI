import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Lesson } from '../../../../shared/models/course-builder.model';

@Component({
  selector: 'app-add-lesson-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-lesson-modal.component.html',
  styleUrl: './add-lesson-modal.component.css',
})
export class AddLessonModalComponent implements OnInit {
  @Input() lesson: Lesson | null = null;
  @Input() tenantId: string = '';
  @Input() teacherId: string = '';
  @Input() courseId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Lesson>>();

  title: string = '';
  content: string = '';
  isEditMode = false;

  ngOnInit(): void {
    if (this.lesson) {
      this.isEditMode = true;
      this.title = this.lesson.title;
      this.content = this.lesson.content || '';
    }
  }

  get isValid(): boolean {
    return this.title.trim().length >= 3 && this.content.trim().length >= 10;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.isValid) return;

    this.save.emit({
      title: this.title.trim(),
      type: 'document', // Always document for simplicity in this flow
      content: this.content.trim(),
    });
  }
}
