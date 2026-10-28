# SMTP email setup

The password-reset and email-verification flows require SMTP settings in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=KTSHOP <your-address@gmail.com>
```

For Gmail, enable 2-Step Verification and create an App Password. Use that App Password for `SMTP_PASS`; do not use the normal Google account password. Keep `.env` out of source control and restart the backend after changing these values.

The backend returns an explicit SMTP configuration error until all required values (`SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`) are present.