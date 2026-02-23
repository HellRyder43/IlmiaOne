import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@ilmiaone.org'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ilmiaone.org'

export async function sendAdminRegistrationNotification({
  residentName,
  houseNumber,
  street,
  residentEmail,
  adminEmail,
}: {
  residentName: string
  houseNumber: string
  street?: string
  residentEmail: string
  adminEmail: string
}) {
  const approvalUrl = `${BASE_URL}/admin/registrations`
  const addressDisplay = `${houseNumber}${street ? `, ${street}` : ''}`
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Resident Registration — ${residentName}, House ${addressDisplay}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">New Registration Pending Approval</h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">A new resident has registered and is awaiting your approval.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;">Name</td>
              <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${residentName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Address</td>
              <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${addressDisplay}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Email</td>
              <td style="padding:8px 0;color:#1e293b;font-size:14px;">${residentEmail}</td>
            </tr>
          </table>
          <a href="${approvalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Review Registration</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Ilmia One Community Portal</p>
      </div>
    `,
  })
}

export async function sendRegistrationApprovedEmail({
  residentName,
  residentEmail,
}: {
  residentName: string
  residentEmail: string
}) {
  const loginUrl = `${BASE_URL}/login`
  await resend.emails.send({
    from: FROM,
    to: residentEmail,
    subject: 'Welcome to Ilmia One — Registration Approved',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Welcome, ${residentName}!</h2>
          <p style="color:#64748b;margin:0 0 16px;font-size:14px;">Your registration for Ilmia One has been approved by the committee.</p>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">You can now log in to access your resident dashboard, pay maintenance fees, register visitors, and stay updated on community events.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Log In Now</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Ilmia One Community Portal</p>
      </div>
    `,
  })
}

export async function sendRegistrationRejectedEmail({
  residentName,
  residentEmail,
  reason,
}: {
  residentName: string
  residentEmail: string
  reason: string
}) {
  const loginUrl = `${BASE_URL}/login`
  await resend.emails.send({
    from: FROM,
    to: residentEmail,
    subject: 'Ilmia One — Registration Update',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Registration Not Approved</h2>
          <p style="color:#64748b;margin:0 0 16px;font-size:14px;">Hi ${residentName}, your registration for Ilmia One was not approved at this time.</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#991b1b;font-size:14px;margin:0;font-weight:600;">Reason:</p>
            <p style="color:#7f1d1d;font-size:14px;margin:8px 0 0;">${reason}</p>
          </div>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">You may log in to review the reason and submit a corrected registration.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Log In & Resubmit</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Ilmia One Community Portal</p>
      </div>
    `,
  })
}

export async function sendStaffInviteEmail({
  fullName,
  email,
  roleDisplayName,
  inviteLink,
}: {
  fullName: string
  email: string
  roleDisplayName: string
  inviteLink: string
}) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You've been invited to Ilmia One — Set your password to get started",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">You've been invited to Ilmia One</h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Hi ${fullName}, you've been added to the community portal as <strong style="color:#1e293b;">${roleDisplayName}</strong>.</p>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#92400e;font-size:14px;margin:0;">This link can only be used <strong>once</strong> and expires in 24 hours. If you've already opened it, ask your administrator to resend the invite.</p>
          </div>
          <a href="${inviteLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Set Your Password</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Ilmia One Community Portal</p>
      </div>
    `,
  })
}
