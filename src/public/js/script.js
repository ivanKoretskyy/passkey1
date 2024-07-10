document.getElementById('registerButton').addEventListener('click', register);
document.getElementById('loginButton').addEventListener('click', login);


function showMessage(message, isError = false) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.style.color = isError ? 'red' : 'green';
}

async function register() {
    // Retrieve the username from the input field
    const username = document.getElementById('username').value;

    try {
        // Get registration options from your server. Here, we also receive the challenge.
        const response = await fetch('/api/passkey/registerStart', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: username})
        });

        // Check if the registration options are ok.
        if (!response.ok) {
            throw new Error('User already exists or failed to get registration options from server');
        }

        // Convert the registration options to JSON.
        const options = await response.json();
        // console.log('options for create passkey from backend',options)

        // This triggers the browser to display the passkey / WebAuthn modal (e.g. Face ID, Touch ID, Windows Hello).
        // A new attestation is created. This also means a new public-private-key pair is created.
        const attestationResponse = await startRegistration(options);


        // const publicKeyCredentialCreationOptions = {
        //     challenge: Uint8Array.from(
        //         options.challenge, c => c.charCodeAt(0)),
        //     rp: {
        //         name: options.rp.name || "Passkeys Tutorial",
        //         id:  options.rp.id || window.location.hostname
        //     },
        //     user: {
        //         id: Uint8Array.from(
        //             (options.user.id), c => c.charCodeAt(0)),
        //         name: options.user.name || 'ivan1',
        //         displayName: options.user.displayName || 'ivan1',
        //     },
        //     pubKeyCredParams: options.pubKeyCredParams || [{alg: -7, type: "public-key"}],
        //     authenticatorSelection: options.authenticatorSelection || {
        //         authenticatorAttachment: "cross-platform",
        //     },
        //     timeout: options.timeout || 60000,
        //     attestation: options.attestation || "direct",
        //     excludeCredentials: options.excludeCredentials,
        //     extensions: options.extensions
        // };
        // console.info('--------------');
        // console.info(publicKeyCredentialCreationOptions);
        // const credential = await navigator.credentials.create({
        //     publicKey: publicKeyCredentialCreationOptions
        // });

        // Send attestationResponse back to server for verification and storage.
        const verificationResponse = await fetch('/api/passkey/registerFinish', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(attestationResponse)
            //body: JSON.stringify(credential)
        });

        if (verificationResponse.ok) {
            showMessage('Registration successful');
        } else {
            showMessage('Registration failed', true);
        }
    } catch
        (error) {
            console.error('error', error)
        showMessage('Error: ' + error.message, true);
    }
}

async function login() {
    // Retrieve the username from the input field
    const username = document.getElementById('username').value;

    try {
        // Get login options from your server. Here, we also receive the challenge.
        const response = await fetch('/api/passkey/loginStart', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: username})
        });
        // Check if the login options are ok.
        if (!response.ok) {
            throw new Error('Failed to get login options from server');
        }
        // Convert the login options to JSON.
        const options = await response.json();
        console.log('options from backend for start login: ',options)

        // This triggers the browser to display the passkey / WebAuthn modal (e.g. Face ID, Touch ID, Windows Hello).
        // A new assertionResponse is created. This also means that the challenge has been signed.
        const assertionResponse = await startAuthentication(options);

        console.info('result of navigator credentials get(): ', assertionResponse)

        // Send assertionResponse back to server for verification.
        const verificationResponse = await fetch('/api/passkey/loginFinish', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(assertionResponse)
        });

        if (verificationResponse.ok) {
            showMessage('Login successful');
        } else {
            showMessage('Login failed', true);
        }
    } catch (error) {
        showMessage('Error: ' + error.message, true);
    }
}







function browserSupportsWebAuthn() {
    return (
      window?.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function'
    );
  }


function base64URLStringToBuffer(base64URLString) {
    // console.info('base64URLString', base64URLString)
    // Convert from Base64URL to Base64
    const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
    /**
     * Pad with '=' until it's a multiple of four
     * (4 - (85 % 4 = 1) = 3) % 4 = 3 padding
     * (4 - (86 % 4 = 2) = 2) % 4 = 2 padding
     * (4 - (87 % 4 = 3) = 1) % 4 = 1 padding
     * (4 - (88 % 4 = 0) = 4) % 4 = 0 padding
     */
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
  
    // Convert to a binary string
    const binary = atob(padded);
  
    // Convert binary string to buffer
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
  
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  
    return buffer;
  }
  

function toPublicKeyCredentialDescriptor(
    descriptor
  ) {
    const { id } = descriptor;
  
    return {
      ...descriptor,
      id: base64URLStringToBuffer(id),
      /**
       * `descriptor.transports` is an array of our `AuthenticatorTransportFuture` that includes newer
       * transports that TypeScript's DOM lib is ignorant of. Convince TS that our list of transports
       * are fine to pass to WebAuthn since browsers will recognize the new value.
       */
      transports: descriptor.transports,
    };
  }


  function warnOnBrokenImplementation(methodName, cause) {
    console.warn(
      `The browser extension that intercepted this WebAuthn API call incorrectly implemented ${methodName}. You should report this error to them.\n`,
      cause,
    );
  }

function bufferToBase64URLString(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
  
    for (const charCode of bytes) {
      str += String.fromCharCode(charCode);
    }
  
    const base64String = btoa(str);
  
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  
function toAuthenticatorAttachment(
    attachment,
  ) {
    const attachments = ['cross-platform', 'platform'];
    if (!attachment) {
      return;
    }
  
    if (attachments.indexOf(attachment) < 0) {
      return;
    }
  
    return attachment;
  }
  
async function startRegistration(
    optionsJSON,
  ) {
    if (!browserSupportsWebAuthn()) {
      throw new Error('WebAuthn is not supported in this browser');
    }
  
    // We need to convert some values to Uint8Arrays before passing the credentials to the navigator
    const publicKey = {
      ...optionsJSON,
      challenge: base64URLStringToBuffer(optionsJSON.challenge),
      user: {
        ...optionsJSON.user,
        id: base64URLStringToBuffer(optionsJSON.user.id),
      },
      excludeCredentials: optionsJSON.excludeCredentials?.map(
        toPublicKeyCredentialDescriptor,
      ),
    };
  
    // Finalize options
    const options = { publicKey };
    // Set up the ability to cancel this request if the user attempts another
    // console.info('options from backend for create function:', options);

    // Wait for the user to complete attestation
    let credential;
    try {
      console.log('options for create passkey from backend',options)
      debugger;
      credential = (await navigator.credentials.create(options));
      console.info('browser created public key', credential)
      debugger;
    } catch (err) {
        console.error('error: ',err);
      throw(err)
    }
  
    if (!credential) {
      throw new Error('Registration was not completed');
    }
  
    const { id, rawId, response, type } = credential;
  
    // Continue to play it safe with `getTransports()` for now, even when L3 types say it's required
    let transports = undefined;
    if (typeof response.getTransports === 'function') {
      transports = response.getTransports();
    }
  
    // L3 says this is required, but browser and webview support are still not guaranteed.
    let responsePublicKeyAlgorithm = undefined;
    if (typeof response.getPublicKeyAlgorithm === 'function') {
      try {
        responsePublicKeyAlgorithm = response.getPublicKeyAlgorithm();
      } catch (error) {
        warnOnBrokenImplementation('getPublicKeyAlgorithm()', error);
      }
    }
  
    let responsePublicKey = undefined;
    if (typeof response.getPublicKey === 'function') {
      try {
        const _publicKey = response.getPublicKey();
        if (_publicKey !== null) {
          responsePublicKey = bufferToBase64URLString(_publicKey);
        }
      } catch (error) {
        warnOnBrokenImplementation('getPublicKey()', error);
      }
    }
  
    // L3 says this is required, but browser and webview support are still not guaranteed.
    let responseAuthenticatorData;
    if (typeof response.getAuthenticatorData === 'function') {
      try {
        responseAuthenticatorData = bufferToBase64URLString(
          response.getAuthenticatorData(),
        );
      } catch (error) {
        warnOnBrokenImplementation('getAuthenticatorData()', error);
      }
    }
  
    return {
      id,
      rawId: bufferToBase64URLString(rawId),
      response: {
        attestationObject: bufferToBase64URLString(response.attestationObject),
        clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
        transports,
        publicKeyAlgorithm: responsePublicKeyAlgorithm,
        publicKey: responsePublicKey,
        authenticatorData: responseAuthenticatorData,
      },
      type,
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: toAuthenticatorAttachment(
        credential.authenticatorAttachment,
      ),
    };
  }

function browserSupportsWebAuthnAutofill() {
    if (!browserSupportsWebAuthn()) {
      return new Promise((resolve) => resolve(false));
    }
  
    const globalPublicKeyCredential = window
      .PublicKeyCredential;
  
    if (globalPublicKeyCredential.isConditionalMediationAvailable === undefined) {
      return new Promise((resolve) => resolve(false));
    }
  
    return globalPublicKeyCredential.isConditionalMediationAvailable();
  }
  
  function isValidDomain(hostname) {
    return (
      // Consider localhost valid as well since it's okay wrt Secure Contexts
      hostname === 'localhost' ||
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
    );
  }

  class WebAuthnError extends Error {
    code;
  
    constructor({
      message,
      code,
      cause,
      name,
    }) {
      super(message, { cause });
      this.name = name ?? cause.name;
      this.code = code;
    }
  }

  function identifyAuthenticationError({
    error,
    options,
  }){
    const { publicKey } = options;
  
    if (!publicKey) {
      throw Error('options was missing required publicKey property');
    }
  
    if (error.name === 'AbortError') {
      if (options.signal instanceof AbortSignal) {
        // https://www.w3.org/TR/webauthn-2/#sctn-createCredential (Step 16)
        return new WebAuthnError({
          message: 'Authentication ceremony was sent an abort signal',
          code: 'ERROR_CEREMONY_ABORTED',
          cause: error,
        });
      }
    } else if (error.name === 'NotAllowedError') {
      /**
       * Pass the error directly through. Platforms are overloading this error beyond what the spec
       * defines and we don't want to overwrite potentially useful error messages.
       */
      return new WebAuthnError({
        message: error.message,
        code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
        cause: error,
      });
    } else if (error.name === 'SecurityError') {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        // https://www.w3.org/TR/webauthn-2/#sctn-discover-from-external-source (Step 5)
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: 'ERROR_INVALID_DOMAIN',
          cause: error,
        });
      } else if (publicKey.rpId !== effectiveDomain) {
        // https://www.w3.org/TR/webauthn-2/#sctn-discover-from-external-source (Step 6)
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
          code: 'ERROR_INVALID_RP_ID',
          cause: error,
        });
      }
    } else if (error.name === 'UnknownError') {
      // https://www.w3.org/TR/webauthn-2/#sctn-op-get-assertion (Step 1)
      // https://www.w3.org/TR/webauthn-2/#sctn-op-get-assertion (Step 12)
      return new WebAuthnError({
        message:
          'The authenticator was unable to process the specified options, or could not create a new assertion signature',
        code: 'ERROR_AUTHENTICATOR_GENERAL_ERROR',
        cause: error,
      });
    }
  
    return error;
  }
  

  class BaseWebAuthnAbortService {
    controller;
  

    createNewAbortSignal() {
      // Abort any existing calls to navigator.credentials.create() or navigator.credentials.get()
      if (this.controller) {
        const abortError = new Error(
          'Cancelling existing WebAuthn API call for new one',
        );
        abortError.name = 'AbortError';
        this.controller.abort(abortError);
      }
  
      const newController = new AbortController();
  
      this.controller = newController;
      return newController.signal;
    }
  
    /**
     * Manually cancel any active WebAuthn registration or authentication attempt.
     */
    cancelCeremony() {
      if (this.controller) {
        const abortError = new Error(
          'Manually cancelling existing WebAuthn API call',
        );
        abortError.name = 'AbortError';
        this.controller.abort(abortError);
  
        this.controller = undefined;
      }
    }
  }

  const WebAuthnAbortService = new BaseWebAuthnAbortService();


  async function startAuthentication(
    optionsJSON,
    useBrowserAutofill = false,
  ) {
    if (!browserSupportsWebAuthn()) {
      throw new Error('WebAuthn is not supported in this browser');
    }
  
    // We need to avoid passing empty array to avoid blocking retrieval
    // of public key
    let allowCredentials;
    if (optionsJSON.allowCredentials?.length !== 0) {
      allowCredentials = optionsJSON.allowCredentials?.map(
        toPublicKeyCredentialDescriptor,
      );
    }
  
    // We need to convert some values to Uint8Arrays before passing the credentials to the navigator
    const publicKey = {
      ...optionsJSON,
      challenge: base64URLStringToBuffer(optionsJSON.challenge),
      allowCredentials,
    };
  
    // Prepare options for `.get()`
    const options = {};
  
    /**
     * Set up the page to prompt the user to select a credential for authentication via the browser's
     * input autofill mechanism.
     */
    if (useBrowserAutofill) {
      if (!(await browserSupportsWebAuthnAutofill())) {
        throw Error('Browser does not support WebAuthn autofill');
      }
  
      // Check for an <input> with "webauthn" in its `autocomplete` attribute
      const eligibleInputs = document.querySelectorAll(
        "input[autocomplete$='webauthn']",
      );
  
      // WebAuthn autofill requires at least one valid input
      if (eligibleInputs.length < 1) {
        throw Error(
          'No <input> with "webauthn" as the only or last value in its `autocomplete` attribute was detected',
        );
      }
  
      // `CredentialMediationRequirement` doesn't know about "conditional" yet as of
      // typescript@4.6.3
      options.mediation = 'conditional';
      // Conditional UI requires an empty allow list
      publicKey.allowCredentials = [];
    }
  
    // Finalize options
    options.publicKey = publicKey;
    // Set up the ability to cancel this request if the user attempts another
    options.signal = WebAuthnAbortService.createNewAbortSignal();
  
    // Wait for the user to complete assertion
    let credential;
    try {
      credential = (await navigator.credentials.get(options));
    } catch (err) {
      throw identifyAuthenticationError({ error: err, options });
    }
  
    if (!credential) {
      throw new Error('Authentication was not completed');
    }
  
    const { id, rawId, response, type } = credential;
  
    let userHandle = undefined;
    if (response.userHandle) {
      userHandle = bufferToBase64URLString(response.userHandle);
    }
  
    // Convert values to base64 to make it easier to send back to the server
    return {
      id,
      rawId: bufferToBase64URLString(rawId),
      response: {
        authenticatorData: bufferToBase64URLString(response.authenticatorData),
        clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
        signature: bufferToBase64URLString(response.signature),
        userHandle,
      },
      type,
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: toAuthenticatorAttachment(
        credential.authenticatorAttachment,
      ),
    };
  }
  