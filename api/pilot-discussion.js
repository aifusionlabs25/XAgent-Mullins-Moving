function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { name, email, company, useCase, notes } = req.body || {};

    if (!name || !email || !company || !useCase) {
      return res.status(400).json({ error: 'All required fields must be completed.' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not defined.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 640px;">
        <div style="border-bottom: 2px solid #4F46E5; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #4F46E5; margin: 0;">New Evan Pilot Discussion Request</h2>
          <p style="color: #666; margin: 8px 0 0;">Private Mullins Moving screening room</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 150px;">Name</td>
            <td style="padding: 8px 12px;">${escapeHtml(name)}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(email)}" style="color: #4F46E5;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Company / Role</td>
            <td style="padding: 8px 12px;">${escapeHtml(company)}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Use Case</td>
            <td style="padding: 8px 12px;">${escapeHtml(useCase)}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <h3 style="font-size: 15px; color: #111; margin: 0 0 8px;">Notes</h3>
          <div style="background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 14px; white-space: pre-line;">${escapeHtml(notes || 'No notes provided.')}</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 0.85em;">This request came from https://x-agent-mullins-moving.vercel.app/</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Fusion Labs <alerts@aifusionlabs.app>',
        to: ['aifusionlabs@gmail.com'],
        reply_to: email,
        subject: `[EVAN PILOT] ${name} - ${company}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', errorText);
      return res.status(502).json({ error: 'Email delivery failed.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pilot discussion error:', error);
    return res.status(500).json({ error: 'Failed to submit.' });
  }
};
