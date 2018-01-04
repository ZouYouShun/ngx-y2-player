import 'rxjs/add/operator/filter';

import { Injectable, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class Y2PlayerService {
  private isLoadApi = false;

  private loadComplete = new BehaviorSubject(false);

  get window() {
    if (window) {
      return window;
    }
  }

  constructor() { }

  ready() {
    return this.loadComplete.filter(state => state === true);
  }

  loadY2Api(elm: HTMLAnchorElement, render: Renderer2) {
    const id = this.createVideoId();
    render.setAttribute(elm, 'id', id);

    // if this api is not load, load this api
    if (!this.isLoadApi) {
      this.isLoadApi = true;
      const tag = render.createElement('script');
      render.setAttribute(tag, 'src', 'https://www.youtube.com/player_api');
      const firstScriptTag = render.selectRootElement('script'); // 會取道第一個
      render.insertBefore(firstScriptTag.parentNode, tag, firstScriptTag);

      const publicReady = () => {
        if (this.window) {
          console.log('api load!');
          this.loadComplete.next(true);
        }
      };
      this.window['onYouTubeIframeAPIReady'] = publicReady;
    }

    return id;
  }

  private createVideoId() {
    const len = 7;
    return Math.random().toString(35).substr(2, len);
  }

}
