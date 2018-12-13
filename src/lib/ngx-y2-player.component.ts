import { isPlatformBrowser, isPlatformServer } from '@angular/common';
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
  Renderer2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { map, mapTo, switchMap, tap } from 'rxjs/operators';

import { Y2PlayerService } from './ngx-y2-player.service';
import { resizeObservable } from './rxjs.observable.resize';

type THUMBNAIL_TYPE =
  '0.jpg' |
  '1.jpg' |
  '2.jpg' |
  '3.jpg' |
  'default.jpg' |
  'hqdefault.jpg' |
  'mqdefault.jpg' |
  'sddefault.jpg' |
  'maxresdefault.jpg';

// thumbnail: https://gist.github.com/protrolium/8831763
export interface NgxY2PlayerOptions {
  width?: number | 'auto';
  height?: number | 'auto';
  playerVars?: YT.PlayerVars;
  host?: string;
  thumbnail?: THUMBNAIL_TYPE;

  resizeDebounceTime?: number;
  aspectRatio?: number;
}

const defaultRatio = (9 / 16);

@Component({
  selector: 'ngx-y2-player',
  styles: [
    `:host{display:block;width:100%;background-size:cover;background-position:center;background:black}`
  ],
  template: ``,
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
  iframeElement: HTMLIFrameElement;

  private _videoId: string | string[];
  private resize$: Subscription;

  private isEqule = false;
  get isAutoSize() {
    return !(this.playerOptions.width !== 'auto' && this.playerOptions.height !== 'auto');
  }

  constructor(
    private _y2: Y2PlayerService,
    private _elm: ElementRef,
    private _render: Renderer2,
    private _zoun: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {

    if (this.isAutoSize) {
      this._render.setStyle(this._elm.nativeElement, 'padding-bottom', `${100 * (this.playerOptions.aspectRatio || defaultRatio)}%`);
    } else {
      this._render.setStyle(this._elm.nativeElement, 'width', `${this.playerOptions.width}px`);
      this._render.setStyle(this._elm.nativeElement, 'height', `${this.playerOptions.height}px`);
    }

    if (this.playerOptions.thumbnail) {
      const id = this.videoId instanceof Array ? this.videoId[0] : this.videoId;
      this._render.setStyle(this._elm.nativeElement, 'background-image',
        `url('https://i1.ytimg.com/vi/${id}/${this.playerOptions.thumbnail}')`);
    }

    if (isPlatformServer(this.platformId)) { return; }
    this.loadYoutube().subscribe();
  }

  private loadYoutube() {
    return this._y2.loadY2Api(this._elm.nativeElement).pipe(
      switchMap(id => this._y2.ready().pipe(mapTo(id))),
      map(id => {
        let width;
        let height;
        if (this.playerOptions.width !== 'auto' && this.playerOptions.height !== 'auto') {
          width = this.playerOptions.width;
          height = this.playerOptions.height;
        } else {
          ({ width, height } = this.getNowWidthAndHeight());

          // if the init height is equal to now height, it mean this is an resize with width player
          this.isEqule = height !== this.containerElm.offsetHeight;
          this.resize$ = resizeObservable(this.containerElm, () => {
            if (this.videoPlayer) {
              ({ width, height } = this.getNowWidthAndHeight());
              this.videoPlayer.setSize(width, height);
            }
          },
            // init time is 200
            (this.playerOptions.resizeDebounceTime !== undefined ? this.playerOptions.resizeDebounceTime : 200)).subscribe();
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
        this.iframeElement = this.videoPlayer.getIframe();
        this._render.setStyle(this.iframeElement, 'background-size', 'cover');
        this._render.setStyle(this.iframeElement, 'background-position', 'center');
        this.checkAddAllYTEvent();
      }));
  }

  ngOnDestroy(): void {
    if (isPlatformServer(this.platformId)) { return; }
    if (this.resize$) { this.resize$.unsubscribe(); }
    if (this.videoPlayer) { this.videoPlayer.destroy(); }
  }

  private checkAddAllYTEvent() {

    // check ready event
    if (this.videoId instanceof Array || this.onReady.observers.length > 0) {
      this.videoPlayer.addEventListener('onReady', (e) => {

        const elm = this.videoPlayer.getIframe();
        this._render.removeStyle(elm, 'padding-bottom');
        this._render.removeStyle(elm, 'width');
        this._render.removeStyle(elm, 'height');
        this._render.removeStyle(elm, 'background-image');
        this._render.removeStyle(elm, 'background-size');
        this._render.removeStyle(elm, 'background-position');

        if (this.onReady.observers.length > 0) {
          // run in zone
          this._zoun.run(() => this.onReady.emit(e));
        }

        if (this.videoId instanceof Array) {
          if (this.playerOptions.playerVars) {
            if (this.playerOptions.playerVars.autoplay) {
              this.videoPlayer.loadPlaylist(this.videoId);
            } else {
              this.videoPlayer.cuePlaylist(this.videoId);
            }
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

  private getNowWidthAndHeight() {
    const aspectRation = this.playerOptions.aspectRatio || defaultRatio;

    let width = this.containerElm.offsetWidth;
    let height = width * aspectRation;

    if (!this.isEqule && height > this.containerElm.offsetHeight) {
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
