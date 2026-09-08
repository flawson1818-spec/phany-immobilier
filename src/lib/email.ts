import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Envoi d'email avec fallback contrôlé :
 * - si RESEND_API_KEY est présent -> envoi réel via l'API Resend
 * - sinon -> le message est loggé en console (utile en dev / MVP)
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PHANY IMMOBILIER <onboarding@resend.dev>";

  if (!key) {
    console.info(
      `[email:fallback] Pas de RESEND_API_KEY. Email non envoyé.\n  À: ${to}\n  Sujet: ${subject}\n  ${text ?? html}`,
    );
    return { delivered: false as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    console.error("[email] échec Resend:", res.status, await res.text());
    return { delivered: false as const };
  }
  return { delivered: true as const };
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Réinitialisation de votre mot de passe PHANY",
    text: `Pour réinitialiser votre mot de passe, ouvrez ce lien (valable 1 heure) : ${link}`,
    html: `<p>Vous avez demandé la réinitialisation de votre mot de passe PHANY IMMOBILIER.</p>
<p><a href="${link}">Réinitialiser mon mot de passe</a> (lien valable 1 heure)</p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  };
}
