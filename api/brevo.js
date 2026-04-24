export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID || 5);

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API Brevo manquante côté serveur' });
  }

  const { email, score, level, subject, htmlContent } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email manquant' });
  }

  try {
    const headers = {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        updateEnabled: true,
        listIds: [listId],
        attributes: {
          SCORE_QUIZ: score,
          NIVEAU_QUIZ: level
        }
      })
    });

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sender: { name: 'Jordan Henry Paul', email: 'jordan@heliosredaction.fr' },
        to: [{ email }],
        subject: subject || 'Voici ton résultat',
        htmlContent: htmlContent || '<p>Merci d’avoir fait le quiz.</p>'
      })
    });

    const contactData = await contactResponse.json().catch(() => ({}));
    const emailData = await emailResponse.json().catch(() => ({}));

    if (!contactResponse.ok || !emailResponse.ok) {
      return res.status(400).json({
        error: 'Erreur Brevo',
        contact: contactData,
        email: emailData
      });
    }

    return res.status(200).json({ ok: true, contact: contactData, email: emailData });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
