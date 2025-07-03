import { ResponsableSummaryDTO } from "../User/ResponsableSummaryDTO";
import { TicketTypeDTO } from "../TicketTypes/TicketTypeDTO";

export interface EventDTO {
  nombre: string;
  banner: string;
  descripcion: string;
  fecha: Date;
  aforo: number;
  ubicacion: string;
  responsable: ResponsableSummaryDTO; 
  ticketTypes: TicketTypeDTO[];
}