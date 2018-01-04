import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Y2PlayerComponent } from './y2-player.component';
import { Y2PlayerService } from './y2-player.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    Y2PlayerComponent
  ],
  exports: [
    Y2PlayerComponent
  ]
})
export class Y2PlayerModule {
  static forRoot(): ModuleWithProviders {
    return <ModuleWithProviders>{
      ngModule: Y2PlayerModule,
      providers: [
        Y2PlayerService
      ]
    };
  }
}
