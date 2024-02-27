import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeardleQuizComponent } from './heardle-quiz.component';

describe('HeardleQuizComponent', () => {
  let component: HeardleQuizComponent;
  let fixture: ComponentFixture<HeardleQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeardleQuizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeardleQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
