import { TicketService } from "../services/ticket.service";
import { EventIdDTO } from "../dtos/Event/EventIdDTO";
import { Request, Response } from "express";


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
}