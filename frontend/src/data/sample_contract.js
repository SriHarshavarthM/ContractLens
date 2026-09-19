// Enterprise Cloud SaaS Master Services Agreement (v1 and v2)
// Helper to format dynamic dates relative to today

export function getRelativeDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const getSampleDates = () => {
  return {
    today: getRelativeDate(0),
    effectiveDate: getRelativeDate(-30),
    criticalDeadline: getRelativeDate(5),    // 5 days away (7-day alert)
    paymentDue: getRelativeDate(11),         // 11 days away (14-day alert)
    complianceDue: getRelativeDate(25),      // 25 days away (30-day alert)
    renewalCutoff: getRelativeDate(45),      // 45 days away
    expirationDate: getRelativeDate(365),    // 1 year away
  };
};

export const createSampleContractV1 = () => {
  const dates = getSampleDates();
  return `MASTER CLOUD SERVICES AGREEMENT (VERSION 1.0)

This Master Cloud Services Agreement ("Agreement") is made and entered into as of ${dates.effectiveDate} ("Effective Date") by and between:
1. ACME CLOUD SERVICES LLC, a Delaware limited liability company having its principal office at 400 Tech Boulevard, Suite 800, San Francisco, CA 94107 ("Service Provider" or "Provider"), and
2. TECHSTART INNOVATIONS INC., a Delaware corporation having its principal office at 120 Innovation Way, Austin, TX 78701 ("Client" or "Subscriber").

RECITALS
WHEREAS, Provider operates an enterprise cloud computing infrastructure and artificial intelligence data processing platform; and
WHEREAS, Client wishes to procure access to Provider's hosted platform and related API services for enterprise business operations;
NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

SECTION 1: DEFINITIONS & SCOPE OF SERVICES
1.1 "Platform" means Provider's proprietary software-as-a-service cloud computing and telemetry system.
1.2 "Service Level Agreement" (SLA) means the performance, availability, and response specifications outlined in Section 4.
1.3 Source Section: Section 1.1 — Parties: The parties to this Agreement are Acme Cloud Services LLC and TechStart Innovations Inc.

SECTION 2: TERM AND RENEWAL
2.1 Initial Term: The initial term of this Agreement commences on ${dates.effectiveDate} and continues for twelve (12) consecutive months until ${dates.expirationDate} ("Initial Term").
2.2 Automatic Renewal: This Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term. The initial non-renewal notification cutoff is ${dates.renewalCutoff}.

SECTION 3: FEES AND PAYMENT TERMS
3.1 Subscription Fees: Client shall pay Provider a recurring base subscription fee of Twelve Thousand Five Hundred U.S. Dollars ($12,500.00) per month.
3.2 Payment Terms: All invoices shall be issued on the first calendar day of each month and are payable within thirty (30) calendar days from receipt (Net 30). The next pending invoice payment is due on ${dates.paymentDue}.
3.3 Late Payment: Overdue amounts shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law. If payment remains unpaid fifteen (15) days after written demand, Provider may suspend access to the Platform.

SECTION 4: SERVICE LEVEL OBLIGATIONS & SLA CREDITS
4.1 Availability Guarantee: Provider covenants and warrants that the Platform shall maintain an uptime availability of at least 99.9% during every calendar month, excluding scheduled maintenance.
4.2 SLA Reconciliation & Penalty Credits: Provider must conduct monthly availability reconciliation and deliver SLA availability audits by ${dates.criticalDeadline}. If monthly availability falls below 99.9%, Provider shall credit Client 10% of that month's subscription fees; if availability falls below 99.0%, Provider shall credit 25%.
4.3 Support Response Times: Provider shall deliver 24/7 technical support for Priority-1 critical outages with an initial response target within sixty (60) minutes.

SECTION 5: REGULATORY COMPLIANCE AND SECURITY AUDITS
5.1 Data Protection: Both parties shall comply with all applicable data privacy statutes, including GDPR and CCPA.
5.2 Client Compliance Filing: Client must submit its verified quarterly security audit certification and data handling affirmation to Provider no later than ${dates.complianceDue}.
5.3 SOC 2 Attestation: Provider shall furnish Client with an updated annual SOC 2 Type II audit report within ninety (90) days following the close of Provider's fiscal year.

SECTION 6: LIMITATION OF LIABILITY
6.1 Aggregate Liability Cap: Provider's total cumulative liability arising out of or related to this Agreement shall not exceed the aggregate fees paid by Client during the preceding one (1) month.
6.2 Exclusion of Consequential Damages: Neither party shall be liable for indirect, incidental, punitive, or consequential damages.

SECTION 7: MODIFICATIONS AND UNILATERAL CHANGES
7.1 Amendments: Provider reserves the unilateral right to amend technical specifications, SLA targets, and service features upon posting seven (7) days advance electronic notice to the administrative console.

SECTION 8: TERMINATION
8.1 Termination for Cause: Either party may terminate this Agreement upon thirty (30) days prior written notice if the other party materially breaches any provision and fails to cure such breach within the 30-day cure period.
8.2 Termination for Convenience: Client may terminate without cause upon ninety (90) days prior written notice and payment of all accrued fees.
8.3 Customer Data Export: Upon termination, Provider shall provide thirty (30) days of complimentary engineering assistance to export all Client data in structured JSON and CSV formats.

IN WITNESS WHEREOF, the authorized representatives of the parties have executed this Agreement as of the Effective Date.`;
};

export const createSampleContractV2 = () => {
  const dates = getSampleDates();
  return `MASTER CLOUD SERVICES AGREEMENT (VERSION 2.0 - REVISED)

This Master Cloud Services Agreement ("Agreement") is made and entered into as of ${dates.effectiveDate} ("Effective Date") by and between:
1. ACME CLOUD SERVICES LLC, a Delaware limited liability company ("Service Provider" or "Provider"), and
2. TECHSTART INNOVATIONS INC., a Delaware corporation ("Client" or "Subscriber").

SECTION 1: SCOPE AND DEFINITIONS
1.1 Provider provides access to its enterprise cloud computing platform and API suites under updated 2026 enterprise standard terms.

SECTION 2: TERM AND RENEWAL
2.1 Term: Commences on ${dates.effectiveDate} and concludes on ${dates.expirationDate}.
2.2 Automatic Renewal: Automatically renews for 1-year terms unless 90 days notice is given prior to ${dates.renewalCutoff}.

SECTION 3: FEES AND PAYMENT TERMS (MODIFIED)
3.1 Base Subscription: Fifteen Thousand U.S. Dollars ($15,000.00) per month.
3.2 Payment Terms: All invoices are payable within fifteen (15) calendar days from receipt (Net 15). Payment is due on ${dates.paymentDue}.
3.3 Late Penalties: 2.0% compounding monthly interest for balances past due.

SECTION 4: SERVICE LEVELS
4.1 Availability Guarantee: Provider guarantees 99.5% uptime.
4.2 SLA Reconciliation: SLA metric review scheduled for ${dates.criticalDeadline}. SLA credits capped at 5% maximum credit.

SECTION 5: REGULATORY COMPLIANCE
5.1 Client must submit quarterly security attestation by ${dates.complianceDue}.
5.2 Provider SOC2 reports provided upon request subject to additional audit processing fee.

SECTION 6: LIMITATION OF LIABILITY (MODIFIED)
6.1 Provider cumulative liability under any theory shall not exceed Five Thousand U.S. Dollars ($5,000.00) or total fees paid in the prior 1 month, whichever is lower.

SECTION 7: DATA MIGRATION (REMOVED)
[Section 8.3 customer data export assistance from Version 1 has been removed; Client must perform self-service automated export prior to expiration date].

SECTION 8: DISPUTE RESOLUTION AND MANDATORY ARBITRATION (ADDED)
8.1 Mandatory Arbitration: All claims, disputes, or controversies shall be submitted to confidential, binding single-arbitrator arbitration administered by the American Arbitration Association (AAA) in Dover, Delaware. Class actions and jury trials are expressly waived.

IN WITNESS WHEREOF, the parties execute this Agreement.`;
};
