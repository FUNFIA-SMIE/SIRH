import { TestBed } from '@angular/core/testing';

import { ServiceTypeCongeService } from './service-type-conge.service';

describe('ServiceTypeCongeService', () => {
  let service: ServiceTypeCongeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceTypeCongeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
