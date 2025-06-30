import { ResponsableSummaryDTO } from "../User/ResponsableSummaryDTO";

export interface EventSummaryDTO {
  nombre: string;
  banner: string;
  descripcion: string;
  fecha: Date;
  aforo: number;
  responsable: ResponsableSummaryDTO;
}