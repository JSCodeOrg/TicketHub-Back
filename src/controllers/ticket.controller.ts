import { TicketService } from "../services/ticket.service";
import { EventIdDTO } from "../dtos/Event/EventIdDTO";
import * as jwt from 'jsonwebtoken';
import { Request, Response } from "express";
import mercadopago from 'mercadopago';


export class TicketController {
    ticketService: TicketService;

    constructor(ticketService: TicketService) {
        this.ticketService = ticketService;
    }

    public async getTickets(req: Request, res: Response): Promise<void> {
        const { idEvento } = req.params;

        if (!idEvento) {
            res.status(400).json({ message: "Falta el idEvento en la ruta." });
            return;
        }

        const EventId = parseInt(idEvento, 10);

        if (isNaN(EventId)) {
            res.status(400).json({ message: "El idEvento debe ser un número válido." });
            return;
        }

        try {
            const tickets = await this.ticketService.getTickets(EventId);

            if (!tickets || tickets.length === 0) {
                res.status(404).json({ message: "No se encontraron tickets para este evento." });
                return;
            }

            res.status(200).json({ tickets });

        } catch (error) {
            console.error("Error al obtener los tickets:", error);
            res.status(500).json({ message: "Error interno al obtener los tickets.", error: (error as Error).message });
        }
    }

    public async comprarTicket(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        const { ticketTypeId, cantidad } = req.body;

        if (!authHeader) {
            res.status(401).json({ message: 'No se proporcionó token' });
            return;
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, "CLAVESECRETA123456@$PEMI") as { id: number };

        const userId = decoded.id;

        if (!ticketTypeId || !cantidad) {
            res.status(400).json({ message: 'Faltan datos de la compra' });
            return;
        }

        try {
            const initPoint = await this.ticketService.generarCompra(userId, ticketTypeId, cantidad);
            res.status(200).json({ init_point: initPoint });
        } catch (error) {
            console.error("Error al generar la preferencia:", error);
            res.status(500).json({ message: 'Error interno al generar la preferencia.', error: (error as Error).message });
        }
    }
}