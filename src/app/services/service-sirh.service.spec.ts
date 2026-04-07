import { TestBed } from '@angular/core/testing';

import { ServiceSirhService } from './service-sirh.service';

describe('ServiceSirhService', () => {
  let service: ServiceSirhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceSirhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
