import { NgModule } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

export const thirdPartyModules: any[] = [
  NgbModal
]

@NgModule({
  imports: [
    ...thirdPartyModules
  ],
  exports: [
    ...thirdPartyModules
  ]
})
export class SharedModule { }