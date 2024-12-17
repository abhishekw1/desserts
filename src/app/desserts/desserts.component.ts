import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dessert } from '../data/dessert';
import { DessertFilter } from '../data/dessert-filter';
import { DessertService } from '../data/dessert.service';
import { DessertIdToRatingMap, RatingService } from '../data/rating.service';
import { DessertCardComponent } from '../dessert-card/dessert-card.component';
import { ToastService } from '../shared/toast';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, debounceTime, filter, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-desserts',
  standalone: true,
  imports: [DessertCardComponent, FormsModule, JsonPipe],
  templateUrl: './desserts.component.html',
  styleUrl: './desserts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DessertsComponent implements OnInit {
  #dessertService = inject(DessertService);
  #ratingService = inject(RatingService);
  #toastService = inject(ToastService);

  originalName = signal('');
  englishName = signal('');
  loading = signal(false);

  originalName$ = toObservable(this.originalName);
  englishName$ = toObservable(this.englishName);

  desserts$ = combineLatest({
    originalName: this.originalName$,
    englishName: this.englishName$
  }).pipe(
    filter((res) => (res.englishName.length > 3 || res.originalName.length > 3)),
    debounceTime(300),
    tap((res) => this.loading.set(true)),
    switchMap((res) => this.#dessertService.find(res).pipe(catchError((err) => {
      this.#toastService.show('Error loading desserts!')
      return of([]);
    }))),
    tap((res) => this.loading.set(false)),
  )

  ratings = signal<DessertIdToRatingMap>({})
  desserts = toSignal(this.desserts$, { initialValue: [] });

  computedDesserts = computed(() => this.toRated(this.desserts(), this.ratings()));

  constructor() {
    effect(() => {
      this.#toastService.show(this.desserts().length + ' desserts loaded!');
    });
  }

  ngOnInit(): void {
    // this.search();
  }

  // search(): void {
  //   const filter: DessertFilter = {
  //     originalName: this.originalName(),
  //     englishName: this.englishName(),
  //   };

  //   this.loading.set(true);

  //   this.#dessertService.find(filter).subscribe({
  //     next: (desserts) => {
  //       // this.desserts.set(desserts);
  //       this.loading.set(false);
  //     },
  //     error: (error) => {
  //       this.loading.set(false);
  //       this.#toastService.show('Error loading desserts!');
  //       console.error(error);
  //     },
  //   });
  // }

  toRated(desserts: Dessert[], ratings: DessertIdToRatingMap): Dessert[] {
    return desserts.map((d) =>
      ratings[d.id] ? { ...d, rating: ratings[d.id] } : d,
    );
  }

  loadRatings(): void {
    this.loading.set(true);

    this.#ratingService.loadExpertRatings().subscribe({
      next: (ratings) => {
        // const rated = this.toRated(this.desserts(), ratings);
        // this.desserts.set(rated);
        this.ratings.set(ratings);
        this.loading.set(false);
      },
      error: (error) => {
        this.#toastService.show('Error loading ratings!');
        console.error(error);
        this.loading.set(false);
      },
    });
  }

  updateRating(id: number, rating: number): void {
    // console.log('rating changed', id, rating);
    this.ratings.update((ratings) => ({ ...ratings, [id]: rating }))
  }
}
