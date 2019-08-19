[![NPM version](https://badge.fury.io/js/ngx-y2-player.svg)](http://badge.fury.io/js/ngx-y2-player)

# ngx-y2-player

Angular 8+ youtube player can auto resize with container, and full controll with [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) support SSR with preview image.

## Description

Youtube player with with [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), complete response with device, provide an sample way for use youbute player.

## Example
[https://alanzouhome.firebaseapp.com/package/NgxY2Player](https://alanzouhome.firebaseapp.com/package/NgxY2Player)
![](https://res.cloudinary.com/dw7ecdxlp/image/upload/v1515048453/ngx-y2-player_rgfqjo.gif)


### Auto resize with container, not outdistance of container with height
![](https://res.cloudinary.com/dw7ecdxlp/image/upload/v1522162592/y2-resize_halygm.gif)

![](https://res.cloudinary.com/dw7ecdxlp/image/upload/v1522212498/y2-resize2_ugo8sj.gif)



## Install

```ts
npm install ngx-y2-player
```

+ Import `NgxY2PlayerModule` into your main AppModule or the module where you want use.

1. Module

```ts
import { NgxY2PlayerModule } from 'ngx-y2-player';

@NgModule({
  declarations: [ ...something... ],
  imports: [ ...something... , NgxY2PlayerModule],
  providers: [ ...something... ],
  bootstrap: [ ...something... ]
})
export class AppModule {
}
```

2. HTML

```html
<div style="width:80%; height:500px;" #container>
  <ngx-y2-player
    #video
    [videoId]="videoId"
    [playerOptions]="playerOptions"
    [container]="container"
    (ready)="onReady($event)"
    (stateChange)="onStateChange($event)"
    >
  </ngx-y2-player>
</div>

<div>
  <button (click)="pause()"> pause </button>
  <button (click)="play()"> play </button>
  <button (click)="stop()"> stop </button>

  <input type="text" #input value="3600">
  <button (click)="go(input.value)"> go </button>
</div>
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
  videoId: 'z8WdQsPknf0'; // string or string array;

  playerOptions: NgxY2PlayerOptions = {
    height: 500, // you can set 'auto', it will use container width to set size
    width: 500,
    // when container resize, it will call resize function, you can custom this by set resizeDebounceTime, default is 200
    resizeDebounceTime: 0,
    playerVars: {
      autoplay: 1,
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
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

## Attribute

| Attribute | necessary |  type | description |
| --------- | --------- | ---- | -------- |
| `[videoId],[videoUrl]` | yes | Input(`string` or `string[]`) | video id or url with player, accept with string or string array, change this input will change player video. |
| `[playerOptions]` | yes | Input(NgxY2PlayerOptions) | NgxY2PlayerOptions with [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)  |
| `[container]` | no | Input(Template Element) | when set width or height 'auto', it will use this element to set player size auto |
| `(ready)` | no | Output(function($event)) | when video ready emit value |
| `(stateChange)` | no | Output(function($event)) | when video state change emit value |
| `(playbackQualityChange)` | no | Output(function($event)) | Event fired when the playback quality of the player changes |
| `(playbackRateChange)` | no | Output(function($event)) | Event fired when the playback rate of the player changes |
| `(error)` | no | Output(function($event)) | Event fired when an error in the player occurs |
| `(apiChange)` | no | Output(function($event)) | Event fired to indicate thath the player has loaded, or unloaded, a module with exposed API methods. This currently only occurs for closed captioning. |

### NgxY2PlayerOptions
```ts
export interface NgxY2PlayerOptions {
  width?: number | 'auto';
  height?: number | 'auto';
  playerVars?: YT.PlayerVars;
  host?: string;
  thumbnail?: THUMBNAIL_TYPE;

  resizeDebounceTime?: number;
  aspectRatio?: number;
}
```
You can see all playerVars in the https://developers.google.com/youtube/player_parameters#Parameters

### THUMBNAIL_TYPE

```ts
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
```
implement with
https://gist.github.com/protrolium/8831763

