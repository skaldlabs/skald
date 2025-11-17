# Security Policy

## Security at Odin

Security is everyone's responsibility. We handle sensitive user data, payment information, and proprietary content—protecting these is critical to maintaining user trust and our business.

## Security Principles

### 1. Defense in Depth

Multiple layers of security controls to protect against threats.

### 2. Least Privilege

Grant minimum access necessary to perform job functions.

### 3. Zero Trust

Never trust, always verify—even inside our network.

### 4. Security by Design

Build security into products from the start, not as an afterthought.

### 5. Transparency

Be open about security practices with users and within the company.

## Data Classification

### Public

- Marketing materials
- Published content (courses, lessons)
- Public documentation
  **Protection**: Standard web security

### Internal

- Internal communications
- Product roadmaps
- Business metrics
- Employee directory
  **Protection**: Authentication required, internal access only

### Confidential

- User personal data (PII)
- Payment information
- User progress and analytics
- Business contracts
- Financial data
  **Protection**: Encryption at rest and in transit, access logging, limited access

### Restricted

- Security credentials
- Encryption keys
- Authentication secrets
- Source code
  **Protection**: Encrypted, very limited access, MFA required, audit logging

## Access Management

### Account Security

**Password Requirements:**

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common passwords (checked against breach databases)
- Rotate every 90 days for administrative access
- Use password manager (1Password provided)

**Multi-Factor Authentication (MFA):**

- Required for all accounts
- Use authenticator app or hardware key
- SMS only as backup
- Cannot be disabled without security team approval

**SSO (Single Sign-On):**

- Use company SSO when available
- Google Workspace for corporate apps
- SAML/OAuth for third-party tools

### Access Provisioning

**Onboarding:**

- Access requested by manager via IT ticket
- Least privilege principle applied
- Provisioned within 24 hours
- Training completed before access granted

**Access Reviews:**

- Quarterly access reviews by managers
- Automated review reminders
- Unused access automatically revoked
- Document reasons for privileged access

**Offboarding:**

- Access revoked immediately upon termination
- Device return within 24 hours
- Exit interview includes security checklist
- Monitor for unusual activity post-departure

## Device Security

### Company Devices

**Requirements:**

- Full disk encryption enabled
- OS updates automatic
- Antivirus software installed
- Firewall enabled
- Screen lock after 5 minutes
- Biometric or strong password login

**MDM (Mobile Device Management):**

- All company devices enrolled
- Remote wipe capability
- Location tracking enabled
- Compliance monitoring
- Lost/stolen devices reported immediately to IT

**Software:**

- Only approved software installed
- Request new software via IT
- No pirated software
- Regular security scans

### Personal Devices (BYOD)

**If approved:**

- Separate work profile required
- Company data in sandboxed apps only
- MFA required
- Remote wipe consent for work data
- Regular security updates mandatory

**Not allowed:**

- Storing company data locally
- Accessing restricted data
- Using for administrative access

## Network Security

### Office Network

- Segmented networks (corporate, guest, IoT)
- WPA3 encryption
- Regular security audits
- Monitored for intrusions

### Remote Work

- **VPN required** for accessing internal systems
- Use company-provided VPN (no third-party VPNs)
- Avoid public Wi-Fi for sensitive work
- Use personal hotspot when traveling

### Home Network Security

- Change default router password
- Use WPA2 or WPA3 encryption
- Keep router firmware updated
- Separate IoT devices on guest network
- Don't use ISP-provided DNS

## Application Security

### Development Security

**Secure Coding:**

- Follow OWASP Top 10
- Input validation on all user data
- Output encoding to prevent XSS
- Parameterized queries to prevent SQL injection
- Security review for all code changes
- Automated security scanning in CI/CD

**Secrets Management:**

- Never commit secrets to git
- Use AWS Secrets Manager for secrets
- Rotate secrets regularly
- Separate secrets per environment
- Audit access to secrets

**Dependencies:**

- Keep dependencies updated
- Run security scans (npm audit, pip-audit)
- Review security advisories
- Pin versions and review updates
- Minimize dependency count

**Code Review:**

- Security checklist in PR template
- Security team review for high-risk changes
- Automated security scanning
- Peer review required

### Third-Party Services

**Vendor Security:**

- SOC 2 Type II certification preferred
- Security questionnaire required
- Data processing agreements signed
- Regular vendor reviews
- Limit data sharing

**API Security:**

- API keys rotated quarterly
- Use OAuth when available
- Rate limiting enabled
- Monitor API usage
- Revoke unused keys

## Data Protection

### Encryption

**Data at Rest:**

- Database encryption enabled
- S3 bucket encryption
- Full disk encryption on devices
- Encrypted backups

**Data in Transit:**

- TLS 1.3 for all connections
- HTTPS everywhere
- No unencrypted protocols (FTP, Telnet, HTTP)

**Key Management:**

- AWS KMS for encryption keys
- Key rotation every 90 days
- Separate keys per environment
- Access logged and monitored

### Data Handling

**User Data:**

- Collect only necessary data
- Clear retention policies
- User consent required
- Easy data deletion (GDPR/CCPA)
- Data minimization

**Backups:**

- Daily automated backups
- Encrypted backups
- Test restoration quarterly
- 30-day retention
- Offsite backup storage

**Data Deletion:**

- Secure deletion procedures
- Verify complete removal
- Document deletions
- Deletion within 30 days of request

## Privacy Compliance

### GDPR (EU)

- Data protection officer appointed
- Privacy by design
- User consent management
- Data portability
- Right to be forgotten
- Data breach notification (72 hours)

### CCPA (California)

- Privacy policy published
- Opt-out mechanisms
- Data disclosure upon request
- No selling user data

### Other Regulations

- COPPA (children's privacy) - no users under 13
- FERPA (educational records)
- Local data residency requirements

## Incident Response

### Identifying Incidents

**Security Incidents:**

- Unauthorized access
- Data breach or leak
- Malware infection
- Phishing attack
- DDoS attack
- Insider threat
- Lost/stolen device with data

**How to Report:**

1. **Urgent**: Slack #security-incidents + email security@odinlearn.com
2. **Non-urgent**: Email security@odinlearn.com
3. **Anonymous**: Security hotline +47 800 SEC (24/7)

### Response Process

**1. Detection & Analysis (0-1 hour)**

- Confirm incident is real
- Determine scope and severity
- Assemble response team
- Begin documentation

**2. Containment (1-4 hours)**

- Isolate affected systems
- Prevent further damage
- Preserve evidence
- Notify stakeholders

**3. Eradication (4-24 hours)**

- Remove threat
- Patch vulnerabilities
- Reset compromised credentials
- Verify threat eliminated

**4. Recovery (1-7 days)**

- Restore systems from clean backups
- Monitor for re-infection
- Gradual return to normal operations
- Enhanced monitoring

**5. Post-Incident (1-2 weeks)**

- Post-mortem meeting
- Document lessons learned
- Implement preventive measures
- Update incident response plan
- Notify affected users if required

### Breach Notification

**Internal:**

- Security team immediately
- Leadership within 1 hour
- Affected teams within 4 hours
- Company-wide if significant

**External:**

- Legal counsel consulted
- Regulatory notifications (GDPR: 72 hours)
- User notifications (if PII compromised)
- Public statement if major breach
- Law enforcement if criminal activity

## Security Monitoring

### What We Monitor

- Login attempts and failures
- Privileged access usage
- Database queries
- API calls
- File access
- Network traffic
- System changes
- Security tool alerts

### Tools

- **SIEM**: Datadog Security Monitoring
- **IDS/IPS**: AWS GuardDuty
- **Vulnerability Scanning**: Snyk, Trivy
- **Application Security**: Sentry
- **Cloud Security**: Prowler, AWS Security Hub

### Alerts

- Critical: Page on-call immediately
- High: Slack alert to security team
- Medium: Email to security team
- Low: Weekly digest

## Physical Security

### Office Security

- Badge access required
- Visitor sign-in and escort
- Security cameras
- Secure waste disposal (shredding)
- Clean desk policy
- Lock screens when away

### Secure Areas

- Server rooms: Restricted access
- Badge reader logs
- No photos allowed
- Escort required

### Travel Security

- Lock devices when unattended
- Use privacy screens in public
- Don't discuss sensitive info in public
- Use VPN on public networks
- Report lost/stolen devices immediately

## Social Engineering

### Common Attacks

**Phishing:**

- Fake emails requesting credentials
- Look for suspicious sender, urgency, bad grammar
- Verify links before clicking
- Never provide credentials via email

**Spear Phishing:**

- Targeted emails with personal info
- May impersonate colleagues or executives
- Verify unusual requests via another channel

**Vishing (Voice Phishing):**

- Phone calls requesting sensitive info
- May spoof caller ID
- Verify identity through known channels

**Smishing (SMS Phishing):**

- Text messages with malicious links
- Fake alerts or offers
- Don't click links in unexpected texts

### Protection

**Red Flags:**

- Urgency or threats
- Requests for credentials or payment
- Unexpected attachments
- Suspicious sender address
- Generic greetings
- Spelling and grammar errors

**What To Do:**

- Verify identity through known channels
- Hover over links to check URL
- Forward suspicious emails to security@odinlearn.com
- Report phishing attempts
- Don't feel pressured by urgency

**Security Awareness:**

- Quarterly phishing simulations
- Security training for new hires
- Monthly security newsletters
- Report suspicious activity

## Secure Communication

### Email

- Use encryption for sensitive data
- Don't email passwords or credentials
- Be cautious with attachments
- Verify recipient before sending
- Use BCC for mass emails (privacy)

### Messaging

- Use Signal for sensitive personal conversations
- Slack for work communication
- Don't share credentials in messages
- Delete sensitive messages when done

### File Sharing

- Use Google Drive or Dropbox Business
- Set appropriate sharing permissions
- Don't share links publicly
- Revoke access when no longer needed
- Use password protection for sensitive files

### Video Calls

- Use waiting rooms for sensitive meetings
- Verify participants
- Don't share meeting links publicly
- Use backgrounds to hide sensitive info
- Mute when not speaking

## Compliance & Audits

### Security Audits

- Annual penetration testing
- Quarterly vulnerability scans
- SOC 2 Type II audit annually
- Internal security audits quarterly

### Compliance Training

- Required for all employees at hire
- Annual refresher training
- Role-specific training (e.g., developers, finance)
- Tracked and documented

### Security Assessments

- Risk assessments for new projects
- Vendor security reviews
- Third-party security audits
- Business continuity planning

## Roles & Responsibilities

### Everyone

- Follow security policies
- Report security incidents
- Complete security training
- Use strong passwords and MFA
- Lock screens when away
- Don't share credentials

### Developers

- Secure coding practices
- Security testing
- Dependency management
- Secrets management
- Code review

### Managers

- Access reviews
- Security awareness
- Incident reporting
- Policy enforcement
- Training compliance

### Security Team

- Policy development
- Incident response
- Security monitoring
- Vulnerability management
- Training and awareness
- Compliance management

### Leadership

- Resource allocation
- Risk acceptance
- Policy approval
- Culture of security

## Acceptable Use

### Approved Uses

- Work-related activities
- Reasonable personal use during breaks
- Professional development

### Prohibited Uses

- Illegal activities
- Accessing inappropriate content
- Unauthorized data access
- Installing unapproved software
- Circumventing security controls
- Using resources for personal profit
- Cryptocurrency mining
- Torrenting

### Consequences

- First offense: Warning and training
- Second offense: Written warning
- Third offense: Termination
- Illegal activity: Law enforcement

## Security Exceptions

### Requesting Exception

1. Submit request via security@odinlearn.com
2. Provide business justification
3. Document risks and mitigations
4. Security team review
5. Leadership approval for high-risk exceptions
6. Temporary exceptions only (max 90 days)
7. Documented compensating controls

### Regular Reviews

- Exceptions reviewed monthly
- Reapproval required for extensions
- Automatic expiration if not renewed

## Resources

### Getting Help

- **Security questions**: security@odinlearn.com
- **Incident reporting**: #security-incidents
- **Security training**: learning.odinlearn.com/security
- **Policy questions**: Ask security team
- **Anonymous reporting**: Security hotline

### Documentation

- Security wiki: wiki.odinlearn.com/security
- Runbooks: For security team
- Incident response plan: Confidential
- Security architecture: Internal

### Training

- New hire security training (required)
- Annual security refresher (required)
- Role-based training (as needed)
- Secure coding workshop (developers)
- Phishing awareness (monthly)

## Updates

This policy is reviewed and updated quarterly. Last update: January 2025.

Suggestions for improvements: security@odinlearn.com

---

**Acknowledgment**: All employees must acknowledge reading and understanding this policy annually.

---

_Last updated: January 2025_
