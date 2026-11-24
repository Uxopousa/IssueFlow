import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');
  private hasActivatedInitialRoute = false;

  protected focusMainContentAfterNavigation(): void {
    if (!this.hasActivatedInitialRoute) {
      this.hasActivatedInitialRoute = true;
      return;
    }

    this.mainContent()?.nativeElement.focus();
  }
}
