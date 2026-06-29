# Privacy Policy — Ghost Interface

**Last updated: June 28, 2026**

## What Ghost Interface does

Ghost Interface is a Chrome extension that autofills job application forms on supported ATS platforms (Greenhouse, Workday, Lever, iCIMS, BambooHR, Ashby) using profile data you provide. It optionally uses the Anthropic API to generate AI-written answers for open-ended questions.

## Data we collect and how we use it

### Profile data (personal identification information)
You enter your name, email address, phone number, LinkedIn URL, website, resume text, and other professional details into the extension popup. This data is stored locally on your device using `chrome.storage.local` and is used solely to fill job application forms when you activate the extension on a supported page. It is never transmitted to our servers.

### Anthropic API key (authentication credential)
If you want AI-generated answers for essay questions, you enter your own Anthropic API key in the popup. This key is stored locally on your device using `chrome.storage.local`. It is sent only to `api.anthropic.com` when you explicitly click "Generate" on an open-ended field. We never store, log, or transmit your API key to any server we control.

### Job page content (web page content)
When you activate the extension on a job listing, it reads the text content of that page — form field labels and the job description — to scan for fields to fill and to perform a fit-score analysis. This content is processed locally in your browser. If you use the AI generation feature, the job description excerpt is sent to `api.anthropic.com` as part of the prompt. It is not stored by us.

## Data we do not collect

- We do not collect health, financial, or payment information.
- We do not read your browsing history or track pages you visit beyond the active job application tab.
- We do not log keystrokes, mouse movement, or user activity.
- We do not transmit any data to servers we own or operate.
- We do not use analytics or tracking tools of any kind.

## Third-party services

The only third-party service used is the **Anthropic API** (`api.anthropic.com`), and only when you explicitly click "Generate" on an open-ended field. Please review [Anthropic's privacy policy](https://www.anthropic.com/privacy) to understand how they handle API requests.

## Data storage and retention

All data (profile, API key) is stored locally in your browser via `chrome.storage.local`. You can delete it at any time by clearing the extension's storage in Chrome settings or by uninstalling the extension.

## Changes to this policy

If this policy changes materially, the updated version will be published in this repository with an updated date.

## Contact

For questions, open an issue at: https://github.com/cristianrm11/ghost-interface/issues
