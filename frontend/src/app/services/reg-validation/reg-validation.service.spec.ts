import { TestBed } from '@angular/core/testing';

import { RegValidationService } from './reg-validation.service';

describe('RegValidationService', () => {
  let service: RegValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
