import 'rxjs/add/operator/take';

import { AfterContentInit, Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core';

import { Y2PlayerService } from './y2-player.service';

export interface Y2PlayerOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: YT.PlayerVars;
}

@Component({
  selector: 'y2-player',
  templateUrl: './y2-player.component.html',
  styleUrls: ['./y2-player.component.scss']
})
export class Y2PlayerComponent implements AfterContentInit {
  @Input('playerOptions') private playerOptions: Y2PlayerOptions;
  @Output('ready') ready = new EventEmitter();
  @Output('change') change = new EventEmitter();

  private tagId: string;
  videoPlayer: YT.Player;

  constructor(
    private _renderer: Renderer2,
    private _y2: Y2PlayerService,
    private player: ElementRef) {
  }

  ngAfterContentInit(): void {
    this.tagId = this._y2.loadY2Api(this.player.nativeElement, this._renderer);

    this._y2.ready()
      .take(1)
      .subscribe(() => {

        const onReady = (event) => {
          this.ready.emit(event);
        };

        const onStateChange = (event) => {
          this.change.emit(event);
        };

        this.videoPlayer = new YT.Player(this.tagId, {
          height: this.playerOptions.height || 500,
          width: this.playerOptions.width || 800,
          videoId: this.playerOptions.videoId,
          events: {
            onReady: onReady,
            onStateChange: onStateChange
          },
          playerVars: this.playerOptions.playerVars
        });
      });
  }
}
