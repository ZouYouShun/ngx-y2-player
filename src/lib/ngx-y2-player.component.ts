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

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
export function getIdFromYoutubeUrl(url: string) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : '';
}

const defaultRatio = (9 / 16);

@Component({
  selector: 'ngx-y2-player',
  styles: [
    `:host{display:block;width:100%;background:black}`
  ],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxY2PlayerComponent implements AfterViewInit, OnDestroy {
  @Input('playerOptions') playerOptions: NgxY2PlayerOptions;
  @Input('container') containerElm: HTMLElement;

  @Input('videoUrl')
  set videoUrl(value: string | string[]) {
    if (value instanceof Array) {
      this.videoId = value.map(v => getIdFromYoutubeUrl(v));
    } else {
      this.videoId = getIdFromYoutubeUrl(value);
    }
  }
  @Input('videoId')
  get videoId() {
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
  private initHeight = 0;

  get isAutoSize() { return this.playerOptions.width === 'auto' || this.playerOptions.height === 'auto'; }

  constructor(
    private _y2: Y2PlayerService,
    private _elm: ElementRef,
    private _render: Renderer2,
    private _zoun: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (this.containerElm) { this.initHeight = this.containerElm.offsetHeight; }

    this.setInitStyle();

    if (isPlatformServer(this.platformId)) { return; }

    this.loadYoutube().subscribe();
  }

  ngOnDestroy(): void {
    if (isPlatformServer(this.platformId)) { return; }
    if (this.resize$) { this.resize$.unsubscribe(); }
    if (this.videoPlayer) { this.videoPlayer.destroy(); }
  }

  private setInitStyle() {
    if (this.isAutoSize) {
      this.setAutoSize();
    } else {
      this._render.setStyle(this._elm.nativeElement, 'width', `${this.playerOptions.width}px`);
      this._render.setStyle(this._elm.nativeElement, 'height', `${this.playerOptions.height}px`);
    }
    this._render.setStyle(this._elm.nativeElement, 'background-size', 'cover');
    this._render.setStyle(this._elm.nativeElement, 'background-position', 'center');
    if (this.playerOptions.thumbnail) {
      const id = this.videoId instanceof Array ? this.videoId[0] : this.videoId;
      this._render.setStyle(this._elm.nativeElement,
        'background-image',
        `url('https://img.youtube.com/vi/${id}/${this.playerOptions.thumbnail}')`
      );
    }
  }

  private setAutoSize() {
    if (+this.initHeight !== 0) {
      const width = this.initHeight / (this.playerOptions.aspectRatio || defaultRatio);
      if (!this.containerElm.offsetWidth || width < this.containerElm.offsetWidth) {
        this._render.setStyle(this._elm.nativeElement, 'height', `${this.initHeight}px`);
        this._render.setStyle(this._elm.nativeElement, 'width', `${width}px`);
        return;
      }
    }
    this._render.setStyle(this._elm.nativeElement, 'height', 0);
    this._render.setStyle(this._elm.nativeElement, 'padding-bottom', `${100 * (this.playerOptions.aspectRatio || defaultRatio)}%`);
  }

  private loadYoutube() {
    return this._y2.loadY2Api(this._elm.nativeElement).pipe(
      switchMap(id => this._y2.ready().pipe(mapTo(id))),
      map(id => {
        let width;
        let height;
        if (this.isAutoSize) {

          ({ width, height } = this.getNowWidthAndHeight());

          this.resize$ = resizeObservable(this.containerElm,
            () => {
              if (this.videoPlayer) {
                ({ width, height } = this.getNowWidthAndHeight());
                this.videoPlayer.setSize(width, height);
              }
            },
            // default time is 200
            (this.playerOptions.resizeDebounceTime !== undefined ? this.playerOptions.resizeDebounceTime : 200)).subscribe();
        } else {
          width = this.playerOptions.width;
          height = this.playerOptions.height;
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

  private checkAddAllYTEvent() {

    // check ready event
    this.videoPlayer.addEventListener('onReady', (e) => {

      this._render.removeStyle(this.iframeElement, 'padding-bottom');
      this._render.removeStyle(this.iframeElement, 'width');
      this._render.removeStyle(this.iframeElement, 'height');
      this._render.removeStyle(this.iframeElement, 'background-image');
      this._render.removeStyle(this.iframeElement, 'background-size');
      this._render.removeStyle(this.iframeElement, 'background-position');

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

    if (this.initHeight !== 0 && height > this.initHeight) {
      height = this.initHeight;
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
