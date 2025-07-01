import { Repository } from "typeorm";
import { Eventos } from "../entities/Event";
import { Ticket } from "../entities/Ticket";
import { TicketTypes } from "../entities/Ticket_Types";
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { minioClient } from '../config/minioClient';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { User } from "../entities/User";

export class TicketService {

    private eventRepository: Repository<Eventos>;
    private ticketRepository: Repository<Ticket>;
    private ticketTypeRep: Repository<TicketTypes>;
    private mpClient: MercadoPagoConfig;
    private preferenceClient: Preference;
    private paymentClient: Payment;

    constructor(
        eventRepository: Repository<Eventos>,
        ticketRepository: Repository<Ticket>,
        ticketTypeRep: Repository<TicketTypes>
    ) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRep = ticketTypeRep;

        this.mpClient = new MercadoPagoConfig({
            accessToken: 'APP_USR-1973662563816869-070113-55a5e506c6378ab121682d9ae1c11da4-2530745776'
        });

        this.preferenceClient = new Preference(this.mpClient);
        this.paymentClient = new Payment(this.mpClient);

    }


    public async getTickets(EventId: number): Promise<{ nombre: string; cantidad_disponible: number }[]> {
        const ticketTypes = await this.ticketTypeRep.find({
            where: {
                evento: { id: EventId }
            },
            select: ['nombre', 'cantidad_disponible']
        });

        return ticketTypes.map(tt => ({
            nombre: tt.nombre ?? '',
            cantidad_disponible: tt.cantidad_disponible ?? 0
        }));
    }

    public async generarCompra(userId: number, ticketTypeId: number, cantidad: number): Promise<string[]> {
        const ticketType = await this.ticketTypeRep.findOne({
            where: { id: ticketTypeId },
            relations: ['evento']
        });

        if (!ticketType) throw new Error("Tipo de ticket no encontrado");
        if (!ticketType.evento) throw new Error("El tipo de ticket no tiene evento asociado");
        if (!ticketType.evento.nombre) throw new Error("El evento no tiene nombre");

        if ((ticketType.cantidad_disponible ?? 0) < cantidad) {
            throw new Error(`No hay suficientes tickets disponibles. Disponibles: ${ticketType.cantidad_disponible}`);
        }

        const savedPaths: string[] = [];
        const eventoNameSanitized = ticketType.evento.nombre.replace(/\s+/g, '_');

        for (let i = 0; i < cantidad; i++) {
            const result = await this.ticketRepository.query(
                `INSERT INTO "Tickets" (usuario_id, tipo_ticket_id, estado) 
             VALUES ($1, $2, $3) RETURNING id`,
                [userId, ticketTypeId, 'ACTIVO']
            );

            const ticketId = result[0].id;

            const payload = {
                userId,
                ticketTypeId,
                eventoId: ticketType.evento.id,
                ticketId: ticketId,
                ticketNumber: i + 1,
                iat: Math.floor(Date.now() / 1000),
                eventoFecha: ticketType.evento.fecha
            };

            const ticketToken = jwt.sign(payload, "CLAVESECRETA123456@$PEMI", { expiresIn: "12h" });

            const qrBuffer = await QRCode.toBuffer(ticketToken, { type: 'png' });

            const timestamp = Date.now();
            const objectName = `${userId}/${eventoNameSanitized}/qr_${ticketTypeId}_${timestamp}_${i + 1}.png`;

            await minioClient.putObject('tickets', objectName, qrBuffer, qrBuffer.length, {
                'Content-Type': 'image/png'
            });

            await this.ticketRepository.query(
                `UPDATE "Tickets" SET "qrPath" = $1 WHERE id = $2`,
                [objectName, ticketId]
            );

            savedPaths.push(objectName);
        }

        ticketType.cantidad_disponible = (ticketType.cantidad_disponible ?? 0) - cantidad;
        await this.ticketTypeRep.save(ticketType);

        return savedPaths;
    }

    public async getUserTicketsForEventWithFiles(
        userId: number,
        eventoId: number
    ): Promise<{ nombreTipoTicket: string; qrFile: string }[]> {

        const tickets = await this.ticketRepository.query(`
        SELECT t."qrPath", tt."nombre" AS "nombreTipoTicket"
        FROM "Tickets" t
        JOIN "Tipos_tickets" tt ON t."tipo_ticket_id" = tt."id"
        JOIN "Eventos" e ON tt."evento_id" = e."id"
        WHERE t."usuario_id" = $1 AND e."id" = $2
    `, [userId, eventoId]);

        const results: { nombreTipoTicket: string; qrFile: string }[] = [];

        for (const t of tickets) {
            if (!t.qrPath) {
                continue;
            }

            try {
                const stream = await minioClient.getObject('tickets', t.qrPath);

                const buffer = await new Promise<Buffer>((resolve, reject) => {
                    const chunks: Buffer[] = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', (err) => reject(err));
                });

                const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

                results.push({
                    nombreTipoTicket: t.nombreTipoTicket,
                    qrFile: base64Image
                });

            } catch (err) {
                console.error(`Error al recuperar QR para ticket:`, err);
            }
        }

        return results;
    }

    public async validarYUsarTicket(token: string): Promise<string> {
        try {
            const decoded = jwt.verify(token, "CLAVESECRETA123456@$PEMI") as { ticketId: number };

            const ticketId = decoded.ticketId;

            console.log(ticketId)
            console.log(ticketId)
            console.log(ticketId)
            console.log(ticketId)
            console.log(ticketId)

            const ticket = await this.ticketRepository.findOne({
                where: { id: ticketId }
            });

            if (!ticket) {
                throw new Error("Ticket no encontrado");
            }

            if (ticket.estado !== 'ACTIVO') {
                throw new Error(`El ticket no está activo (estado actual: ${ticket.estado})`);
            }

            ticket.estado = 'USADO';
            await this.ticketRepository.save(ticket);

            return `El ticket ${ticketId} ha sido validado y marcado como USADO`;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new Error("El token del ticket ha expirado");
            }
            if (err instanceof jwt.JsonWebTokenError) {
                throw new Error("El token del ticket no es válido");
            }
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error("Error desconocido");
        }
    }
}


