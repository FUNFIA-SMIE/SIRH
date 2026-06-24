import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationPointagesComponent } from './configuration-pointages.component';

describe('ConfigurationPointagesComponent', () => {
  let component: ConfigurationPointagesComponent;
  let fixture: ComponentFixture<ConfigurationPointagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationPointagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationPointagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
