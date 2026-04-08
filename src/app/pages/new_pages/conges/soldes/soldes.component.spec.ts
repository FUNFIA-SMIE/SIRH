import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoldesComponent } from './soldes.component';

describe('SoldesComponent', () => {
  let component: SoldesComponent;
  let fixture: ComponentFixture<SoldesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoldesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoldesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
