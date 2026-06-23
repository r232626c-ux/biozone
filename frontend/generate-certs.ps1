# Generate self-signed certificates for localhost HTTPS development
# Run this script from the frontend directory

$certPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Generating self-signed certificates for HTTPS development..."
Write-Host "Certificate path: $certPath"

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "⚠️  OpenSSL not found. Trying alternative method using Windows certificate utilities..."
    
    # Alternative: Use PowerShell certificate commands
    $cert = New-SelfSignedCertificate -CertStoreLocation Cert:\CurrentUser\My -DnsName localhost, 127.0.0.1, *.local -KeyUsage DigitalSignature -KeySpec RSA2048 -KeyLength 2048 -NotAfter (Get-Date).AddYears(1)
    
    # Export certificate
    $certPassword = ConvertTo-SecureString -String "password" -AsPlainText -Force
    Export-PfxCertificate -Cert $cert -FilePath "$certPath\localhost.pfx" -Password $certPassword
    
    Write-Host "✅ Certificate generated at: $certPath\localhost.pfx"
    Write-Host "⚠️  Note: You may need to convert this to PEM format or update vite.config.js to use .pfx files"
    exit
}

# Use OpenSSL to generate certificates
$opensslCmd = $opensslPath.Source

Set-Location $certPath

# Generate private key
& $opensslCmd genrsa -out localhost-key.pem 2048
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate private key"
    exit 1
}

# Generate certificate
& $opensslCmd req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 `
  -subj "/C=ZA/ST=State/L=City/O=Biozone/CN=localhost"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate certificate"
    exit 1
}

Write-Host "✅ Certificates generated successfully!"
Write-Host "   Private key: $certPath\localhost-key.pem"
Write-Host "   Certificate: $certPath\localhost.pem"
Write-Host ""
Write-Host "⚠️  Browser Warning: When you first access https://localhost:5173"
Write-Host "    you'll see a certificate warning (self-signed)."
Write-Host "    This is expected for development. Click 'Advanced' and 'Proceed'."
