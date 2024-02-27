import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyHeardleComponent } from './daily-heardle.component';

describe('DailyHeardleComponent', () => {
  let component: DailyHeardleComponent;
  let fixture: ComponentFixture<DailyHeardleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyHeardleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DailyHeardleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
