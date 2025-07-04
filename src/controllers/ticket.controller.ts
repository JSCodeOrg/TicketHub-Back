import { TicketService } from "../services/ticket.service";
import { EventIdDTO } from "../dtos/Event/EventIdDTO";
import * as jwt from 'jsonwebtoken';
import { Request, Response } from "express";
import mercadopago from 'mercadopago';
import { EventDTO } from "../dtos/Event/EventDTO";


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
            const tickets = await this.ticketService.comprarTicketDirecto(userId, ticketTypeId, cantidad);
            res.status(200).json({ 
                message: 'Compra realizada con éxito',
                tickets: tickets 
            });
        } catch (error) {
            console.error("Error al procesar la compra:", error);
            res.status(500).json({ 
                message: 'Error interno al procesar la compra.', 
                error: (error as Error).message 
            });
        }
    }

public async getUserTicketsForEvent(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: "No se proporcionó el token" });
            return;
        }

        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, "CLAVESECRETA123456@$PEMI") as { id: number };

            const eventoId = parseInt(req.params.eventoId, 10);
            if (isNaN(eventoId)) {
                res.status(400).json({ message: "El idEvento debe ser un número válido." });
                return;
            }

            const result = await this.ticketService.getUserTicketsForEventWithFiles(decoded.id, eventoId);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error al obtener tickets del usuario para el evento:", error);
            res.status(500).json({ message: "Error interno al obtener los tickets", error: (error as Error).message });
        }
    }

    public async validarYUsarTicket(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                res.status(400).json({ message: "Se requiere el token del ticket" });
                return;
            }

            const mensaje = await this.ticketService.validarYUsarTicket(token);
            res.status(200).json({ message: mensaje });

        } catch (error) {
            console.error("Error al validar ticket:", error);
            res.status(400).json({ message: (error as Error).message });
        }
    }


    public async getUserEventsWithTickets(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "No se proporcionó el token" });
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, "CLAVESECRETA123456@$PEMI") as { id: number };

        const result = await this.ticketService.getUserEventsWithTickets(decoded.id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error al obtener eventos del usuario:", error);
        res.status(500).json({ message: "Error interno al obtener los eventos", error: (error as Error).message });
    }
}




}