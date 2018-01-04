import { Component, ViewChild } from '@angular/core';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from './y2-player/y2-player.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('video') video: NgxY2PlayerComponent;

  playerOptions: NgxY2PlayerOptions = {
    videoId: 'z8WdQsPknf0',
    height: 500,
    width: 500,
    playerVars: {
      autoplay: 1,
      // controls: 0
    }
  };
  constructor() { }

  pause() {
    this.video.videoPlayer.pauseVideo();
  }
  play() {
    this.video.videoPlayer.playVideo();
  }
  stop() {
    this.video.videoPlayer.stopVideo();
  }
  go(second) {
    this.video.videoPlayer.seekTo(second, true);
  }

  onReady(event) {
    console.log('ready');
    console.log(event);
  }

  onStateChange(event) {
    console.log('change');
    console.log(event);
  }
}
