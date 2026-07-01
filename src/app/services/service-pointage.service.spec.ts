import { TestBed } from '@angular/core/testing';

import { ServicePointageService } from './service-pointage.service';

describe('ServicePointageService', () => {
  let service: ServicePointageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicePointageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
