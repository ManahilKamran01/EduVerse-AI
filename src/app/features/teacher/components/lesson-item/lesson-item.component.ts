import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson } from '../../../../shared/models/course-builder.model';

@Component({
  selector: 'app-lesson-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-item.component.html',
  styleUrl: './lesson-item.component.css',
})
export class LessonItemComponent {
  @Input() lesson!: Lesson;

  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  showMenu = false;

  get typeLabel(): string {
    switch (this.lesson.type) {
      case 'video':
        return 'Video';
      case 'document':
        return this.isAiGenerated ? 'AI Lesson' : 'Document';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Video';
    }
  }

  get isAiGenerated(): boolean {
    if (this.lesson.type !== 'document' || !this.lesson.content) return false;
    try {
      if (this.lesson.content.includes('isAiGenerated')) {
        const parsed = JSON.parse(this.lesson.content);
        return parsed.isAiGenerated === true;
      }
    } catch (e) {
      // Not a JSON string
    }
    return false;
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.showMenu = false;
    this.edit.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.showMenu = false;
    this.delete.emit();
  }

  closeMenu(): void {
    this.showMenu = false;
  }
}
