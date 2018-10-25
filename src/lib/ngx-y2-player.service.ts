import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class Y2PlayerService {
  private isLoadApi = false;

  private loadComplete = new BehaviorSubject(false);

  private _render = this.rendererFactory.createRenderer(null, null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private rendererFactory: RendererFactory2
  ) { }

  ready(): Observable<boolean> {
    return this.loadComplete.pipe(
      filter(state => state === true),
      take(1)
    );
  }

  loadY2Api(elm: HTMLElement) {

    return of(null).pipe(
      map(() => {

        const id = this.createVideoId();
        this._render.setAttribute(elm, 'id', id);

        // if this api is not load, load this api
        if (!this.isLoadApi) {
          this.isLoadApi = true;
          const tag = this._render.createElement('script');
          this._render.setAttribute(tag, 'src', 'https://www.youtube.com/player_api');
          const firstScriptTag = this._render.selectRootElement('script'); // it will get the first one script
          this._render.insertBefore(firstScriptTag.parentNode, tag, firstScriptTag);

          if (isPlatformBrowser(this.platformId)) {
            window['onYouTubeIframeAPIReady'] = () => {
              // console.log('api load!');
              this.loadComplete.next(true);
            };
          }
        }

        return id;
      })
    );
  }

  private createVideoId() {
    const len = 7;
    return Math.random().toString(35).substr(2, len);
  }

}
