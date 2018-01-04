# NgxY2Player

Angular youtube player by [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) support SSR.

# Demo 
https://zouyoushun.github.io/ngx-y2-player/
![](https://res.cloudinary.com/dw7ecdxlp/image/upload/v1515048453/ngx-y2-player_rgfqjo.gif)

1. install

```
npm install ngx-y2-player
npm install @types/youtube
```
* tsconfig.app.json
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../out-tsc/app",
    "baseUrl": "./",
    "module": "es2015",
    "types": [  //add youtube in the types
      "youtube"
    ]
  },
  "exclude": [
    "test.ts",
    "**/*.spec.ts"
  ]
}
```

# Usage

1. Module

```ts
import { NgxY2PlayerModule } from 'ngx-y2-player';

@NgModule({
  declarations: [ ...something... ],
  imports: [ ...something... , NgxY2PlayerModule.forRoot()], // forRoot only in the app.module
  providers: [ ...something... ],
  bootstrap: [ ...something... ]
})
export class AppModule {
  ...something...
}
```

2. TS

```typescript
import { Component, ViewChild } from '@angular/core';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';

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
```

3. HTML

```html
<ngx-y2-player
  #video
  [playerOptions]="playerOptions"
  (ready)="onReady($event)"
  (change)="onStateChange($event)">
</ngx-y2-player>
<div>
  <button (click)="pause()"> pause </button>
  <button (click)="play()"> play </button>
  <button (click)="stop()"> stop </button>

  <input type="text" #input value="3600">
  <button (click)="go(input.value)"> go </button>
</div>
```

## Attribute

| Attribute | necessary |  type | description |
| --------- | --------- | ---- | -------- |
| [playerOptions] | yes | Input(NgxY2PlayerOptions) | NgxY2PlayerOptions with [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)  |
| (ready) | no | Output(function($event)) | when video ready emit value |
| (change) | no | Output(function($event)) | when video state change emit value |


### NgxY2PlayerOptions
```ts
export interface NgxY2PlayerOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: YT.PlayerVars;
}
```
You can see vars in the https://developers.google.com/youtube/player_parameters#Parameters
