import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxY2PlayerComponent } from './y2-player.component';
import { Y2PlayerService } from './y2-player.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NgxY2PlayerComponent
  ],
  exports: [
    NgxY2PlayerComponent
  ]
})
export class NgxY2PlayerModule {
  static forRoot(): ModuleWithProviders {
    return <ModuleWithProviders>{
      ngModule: NgxY2PlayerModule,
      providers: [
        Y2PlayerService
      ]
    };
  }
}
