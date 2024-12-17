import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  effect,
  model,
  signal,
} from '@angular/core';

const maxRatingInCheatMode = 500;

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingComponent  {
  
  rating = model(0);

  maxRating = computed(()=> this.rating() > 5 ? 500 : 5);
  
  stars = computed(()=>this.toStars(this.rating(),this.maxRating()));

  private toStars(rating: number, maxRating: number): Array<boolean> {
    const stars = new Array<boolean>(rating);
    for (let i = 0; i < maxRating; i++) {
      stars[i] = i < rating;
    }
    return stars;
  }

  rate(rating: number): void {
    this.rating.set(rating);
  }

  enterCheatMode() {
    this.rating.set(500);
  }
}
