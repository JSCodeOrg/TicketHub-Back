import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail', // Usar Gmail como ejemplo (configura uno profesional en producción)
      auth: {
        user: process.env.EMAIL_USER, // Configura estas variables en tu .env
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  public async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"TicketHub" <tickethub@example.com>',
        to: email,
        subject: 'Código de verificación - TicketHub',
        html: `
          <h1>Verifica tu cuenta</h1>
          <p>Tu código de verificación es: <strong>${code}</strong></p>
          <p>Ingresa este código en la aplicación para completar tu registro.</p>
          <p>Si no solicitaste este código, ignora este mensaje.</p>
        `,
      });
      console.log(`Correo enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw new Error('Error al enviar el código de verificación');
    }
  }
}

export const emailService = new EmailService();