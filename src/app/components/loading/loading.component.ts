import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../../_shared/components/loading-spinner/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {

}
