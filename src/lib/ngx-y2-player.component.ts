import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { map, mapTo, switchMap, tap } from 'rxjs/operators';

import { Y2PlayerService } from './ngx-y2-player.service';
import { resizeObservable } from './rxjs.observable.resize';

export interface NgxY2PlayerOptions {
  videoId: string;
  width?: number | 'auto';
  height?: number | 'auto';
  resizeDebounceTime?: number;
  playerVars?: YT.PlayerVars;
  aspectRatio?: number;
}

@Component({
  selector: 'ngx-y2-player',
  template: '',
})
export class NgxY2PlayerComponent implements AfterViewInit, OnDestroy {
  @Input('playerOptions') playerOptions: NgxY2PlayerOptions;
  @Input('container') containerElm: HTMLElement;
  private initHeight = 0;

  @Output('ready') ready = new EventEmitter();
  @Output('change') change = new EventEmitter();

  videoPlayer: YT.Player;

  private resize$: Subscription;

  constructor(
    private _y2: Y2PlayerService,
    private player: ElementRef,
    private _zoun: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {

    if (this.containerElm) { this.initHeight = this.containerElm.offsetHeight; }

    this._y2.loadY2Api(this.player.nativeElement).pipe(
      switchMap(id => this._y2.ready().pipe(mapTo(id))),
      map(id => {
        let width = 800;
        let height = 450;

        if (this.playerOptions.width !== 'auto' && this.playerOptions.height !== 'auto') {
          width = this.playerOptions.width;
          height = this.playerOptions.height;
        } else {
          ({ width, height } = this.getNowWidthAndHeight(width, height));

          if (isPlatformBrowser(this.platformId)) {
            this.resize$ = resizeObservable(this.containerElm,
              () => {
                ({ width, height } = this.getNowWidthAndHeight(width, height));
                if (this.videoPlayer) {
                  this.videoPlayer.setSize(width, height);
                }
              },
              // init time is 200
              (this.playerOptions.resizeDebounceTime !== undefined ? this.playerOptions.resizeDebounceTime : 200)
            ).subscribe();
          }
        }

        return { id, width, height };
      }),
      tap(({ id, width, height }) => {

        this.videoPlayer = new YT.Player(id, {
          width,
          height,
          videoId: this.playerOptions.videoId,
          events: {
            onReady: (event) => {
              this._zoun.run(() => {
                this.ready.emit(event);
              });
            },
            onStateChange: (event) => {
              this._zoun.run(() => {
                this.change.emit(event);
              });
            }
          },
          playerVars: this.playerOptions.playerVars
        });
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.resize$) {
      this.resize$.unsubscribe();
    }
    this.videoPlayer.destroy();
  }

  private getNowWidthAndHeight(width: number, height: number) {
    width = this.containerElm.offsetWidth;
    const aspectRation = this.playerOptions.aspectRatio || (9 / 16);
    height = width * aspectRation;

    // console.log(this.containerElm.offsetHeight);
    if (this.initHeight !== 0 && height > this.containerElm.offsetHeight) {
      height = this.containerElm.offsetHeight;
      width = height / aspectRation;
    }

    // when height is bigger than window height
    if (isPlatformBrowser(this.platformId) &&
      height > window.innerHeight) {
      height = window.innerHeight;
      width = window.innerWidth;
    }

    return { width, height };
  }
}
