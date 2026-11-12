import {
  newsletterSignupBehaviorSpec,
  registerBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { NewsletterSignup } from './newsletter-signup.js';

registerBehaviorSpec(
  newsletterSignupBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <NewsletterSignup
        title={fixture.title}
        list={fixture.list}
        emailLabel={fixture.emailLabel}
        buttonLabel={fixture.buttonLabel}
        successMessage={fixture.successMessage}
        errorMessage={fixture.errorMessage}
        newsletter={fixture.config}
      />
    )),
  ),
  runner,
  { label: '@postkit/react NewsletterSignup' },
);
