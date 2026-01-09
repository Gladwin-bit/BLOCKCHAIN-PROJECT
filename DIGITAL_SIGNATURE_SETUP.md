# Digital Signature Verification Setup

## Environment Configuration

Add the following to your backend `.env` file:

```bash
# Cloudmersive API Key for Digital Signature Verification
CLOUDMERSIVE_API_KEY=16d1a581-29e2-441c-80b6-85a09cec61e5
```

## Important Notes

- The API key has been pre-configured in this setup guide
- Digital signature verification only works with PDF files
- Certificates without valid digital signatures will block registration
- Verification happens automatically when a certificate is uploaded

## Testing

To test the feature:
1. Ensure backend server is running with the API key configured
2. Navigate to registration page
3. Select a non-customer role (manufacturer, distributor, retailer, intermediate)
4. Upload a digitally signed PDF as certificate
5. Watch for automatic verification status

## API Endpoint

- **POST** `/api/signature/verify` - Verifies digital signature in uploaded PDF
