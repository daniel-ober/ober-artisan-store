import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from './firebase-config';

function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');

  const generateRecaptcha = () => {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          sendOTP();
        }
      }, auth);
  }


  const sendOTP = async () => {
    if (phoneNumber.length >= 10) {
      generateRecaptcha();
      let appVerifier = window.recaptchaVerifier;
      signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then(confirmationResult => {
          window.confirmationResult = confirmationResult;
          setConfirmationResult(confirmationResult);
        }).catch((error) => {
          console.log(error);
          setError(error.message);
        });
    }
  };

  const verifyOTP = async () => {
    confirmationResult.confirm(verificationCode).then((result) => {
      // User signed in successfully.
      const user = result.user;
      console.log(user);
    }).catch((error) => {
      // User couldn't sign in (bad verification code, invalid request, etc.)
      console.log(error);
      setError(error.message);
    });
  };

  return (
    <div>
      <input
        type="tel"
        placeholder="Phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button onClick={sendOTP}>Send OTP</button>

      {confirmationResult && (
        <>
          <input
            type="text"
            placeholder="Verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={verifyOTP}>Verify OTP</button>
        </>
      )}
      <div id="recaptcha-container"></div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PhoneAuth;