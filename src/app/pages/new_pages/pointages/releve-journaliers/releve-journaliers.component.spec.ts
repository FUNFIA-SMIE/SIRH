import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleveJournaliersComponent } from './releve-journaliers.component';

describe('ReleveJournaliersComponent', () => {
  let component: ReleveJournaliersComponent;
  let fixture: ComponentFixture<ReleveJournaliersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleveJournaliersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleveJournaliersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
