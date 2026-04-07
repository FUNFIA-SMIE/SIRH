import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TousEmpComponent } from './tous-emp.component';

describe('TousEmpComponent', () => {
  let component: TousEmpComponent;
  let fixture: ComponentFixture<TousEmpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TousEmpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TousEmpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
