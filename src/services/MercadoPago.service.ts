import { MercadoPagoConfig, Preference } from 'mercadopago';

export class MercadoPagoService {
    private client: MercadoPagoConfig;

    constructor(private accessToken: string, private frontendUrl: string) {
        this.client = new MercadoPagoConfig({
            accessToken: this.accessToken
        });
    }

    public async crearPreferenciaPago(
        productos: { nombre: string; cantidad: number; precioUnitario: number }[],
        orden_id: number
    ): Promise<string> {
        console.log("🛒 Productos recibidos para preferencia:", productos);
        const items = productos.map((p, index) => {
            const precio = Number(p.precioUnitario);
            if (isNaN(precio)) {
                throw new Error(`El precio del producto "${p.nombre}" no es válido (${p.precioUnitario}).`);
            }

            return {
                id: `item-${index + 1}`,
                title: p.nombre,
                quantity: p.cantidad,
                unit_price: precio,
                currency_id: 'COP'
            };
        });

        const preferenceData = {
            items,
            back_urls: {
                success: `${this.frontendUrl}/?orderId=${orden_id}`,
                failure: `${this.frontendUrl}/?orderId=${orden_id}`,
                pending: `${this.frontendUrl}/?orderId=${orden_id}`
            },
            auto_return: 'approved'
        };

        try {
            const preferenceClient = new Preference(this.client);
            const response = await preferenceClient.create({ body: preferenceData });
            return response.init_point!;
        } catch (error: any) {
            console.error('🛑 Error al crear preferencia:', error);
            throw new Error('No se pudo crear la preferencia de pago');
        }
    }

}
