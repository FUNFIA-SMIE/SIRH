import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPosteComponent } from './new-poste.component';

describe('NewPosteComponent', () => {
  let component: NewPosteComponent;
  let fixture: ComponentFixture<NewPosteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPosteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPosteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
