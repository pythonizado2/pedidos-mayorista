import type { Producto } from '$lib/types/productos';

export interface VentaDetalle {
	id_venta_detalle: number;
	id_venta: number;
	id_producto: number;
	cantidad: number;
	precio_unitario: number;
	subtotal: number;
	fecha_creacion: string;
}

export interface VentaDetalleInsert {
	id_producto: number;
	cantidad: number;
}

export interface VentaDetalleCompleto extends VentaDetalle {
	producto: Producto | null;
}