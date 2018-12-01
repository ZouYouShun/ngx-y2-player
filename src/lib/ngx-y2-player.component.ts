import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
  width?: number | 'auto';
  height?: number | 'auto';
  playerVars?: YT.PlayerVars;
  host?: string;

  resizeDebounceTime?: number;
  aspectRatio?: number;
}

@Component({
  selector: 'ngx-y2-player',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxY2PlayerComponent implements AfterViewInit, OnDestroy {
  @Input('playerOptions') playerOptions: NgxY2PlayerOptions;
  @Input('container') containerElm: HTMLElement;

  @Input('videoId')
  get videoId() {
    // if there is not set id, use oprion's id
    return this._videoId;
  }
  set videoId(value) {
    this._videoId = value;
    if (this.videoPlayer) {
      if (this.videoPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        if (value instanceof Array) {
          this.videoPlayer.loadPlaylist(value);
        } else {
          this.videoPlayer.loadVideoById(value);
        }
      } else {
        if (value instanceof Array) {
          this.videoPlayer.cuePlaylist(value);
        } else {
          this.videoPlayer.cueVideoById(value);
        }
      }
    }
  }

  @Output('ready') onReady = new EventEmitter();
  @Output('stateChange') onStateChange = new EventEmitter();
  @Output('playbackQualityChange') onPlaybackQualityChange = new EventEmitter();
  @Output('playbackRateChange') onPlaybackRateChange = new EventEmitter();
  @Output('error') onError = new EventEmitter();
  @Output('apiChange') onApiChange = new EventEmitter();

  videoPlayer: YT.Player;

  private _videoId: string | string[];
  private initHeight = 0;
  private resize$: Subscription;

  constructor(
    private _y2: Y2PlayerService,
    private _elm: ElementRef,
    private _zoun: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {

    if (this.containerElm) { this.initHeight = this.containerElm.offsetHeight; }

    this._y2.loadY2Api(this._elm.nativeElement).pipe(
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

        const option: YT.PlayerOptions = {
          width,
          height,
          playerVars: this.playerOptions.playerVars || {}
        };

        if (this.playerOptions.host) {
          option.host = this.playerOptions.host;
        }
        if (this.videoId instanceof Array) {
          option.playerVars.listType = 'player';
        } else {
          option.videoId = this.videoId;
        }

        this.videoPlayer = new YT.Player(id, option);

        this.checkAddAllYTEvent();
      })
    ).subscribe();
  }

  private checkAddAllYTEvent() {

    // check ready event
    if (this.videoId instanceof Array || this.onReady.observers.length > 0) {
      this.videoPlayer.addEventListener('onReady', (e) => {

        if (this.onReady.observers.length > 0) {
          // run in zone
          this._zoun.run(() => this.onReady.emit(e));
        }

        if (this.playerOptions.playerVars) {
          if (this.playerOptions.playerVars.autoplay) {
            this.videoPlayer.loadPlaylist(this.videoId);
          } else {
            this.videoPlayer.cuePlaylist(this.videoId);
          }
        }
      });
    }

    // check other event
    [
      'onStateChange',
      'onPlaybackQualityChange',
      'onPlaybackRateChange',
      'onError',
      'onApiChange'
    ].forEach((eventId: any) => {
      // check this output has bind event
      if (this[eventId].observers.length > 0) {
        // if true, bind event
        this.videoPlayer.addEventListener(eventId, (e) => {
          // run in zone
          this._zoun.run(() => this[eventId].emit(e));
        });
      }
    });
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
