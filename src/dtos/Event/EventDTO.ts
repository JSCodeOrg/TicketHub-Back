import { TicketTypeDTO } from "../TicketTypes/TicketTypeDTO"
import { ResponsableDTO } from "../User/ResponsableDTO"

export interface EventDTO {
    nombre: string,
    descripcion: String,
    aforo: number,
    fecha: Date,
    responsable: ResponsableDTO
    ticketTypes: TicketTypeDTO[]
}