# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Venice.ai Image Studio seriously. If you have discovered a security vulnerability, please follow these steps:

1. **Do not open a public issue.** Publicly disclosing a vulnerability can put the community at risk.

2. **Use GitHub's Private Vulnerability Reporting:**
   - Navigate to the repository's **Security** tab
   - Click **Report a vulnerability**
   - Follow the guided process to submit your report

3. Include as much information as possible:
   - Type of issue (e.g., XSS, Encryption flaw, etc.)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept code or screenshots
   - Impact assessment

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

## Local Encryption Disclaimer

Please note that this application relies on **client-side encryption**:

- The security of the data depends entirely on the strength of the user's password.
- There is no password recovery mechanism.
- We do not store user data on any central server.
- Encryption uses AES-GCM with PBKDF2 key derivation.

## Legal Terms

For full legal terms, including disclaimers, liability limitations, and age restrictions, please see [LEGAL.md](LEGAL.md).

## Third-Party API Security

This application integrates with third-party APIs:

- **Google Gemini API**: Subject to [Google's security policies](https://policies.google.com/security)
- **Venice.ai**: Subject to [Venice.ai's privacy policy](https://venice.ai/legal/privacy-policy)

API keys are stored locally and encrypted. Never share your API keys with others.

Thank you for helping keep Venice.ai Image Studio secure!
