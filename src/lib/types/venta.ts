import type { Cliente } from '$lib/types/clientes';
import type { VentaDetalleCompleto } from '$lib/types/ventaDetalle';

export type EstadoVenta =
	| 'BORRADOR'
	| 'CONFIRMADA'
	| 'CANCELADA';

export interface Venta {
	id_venta: number;
	id_cliente: number;
	id_usuario: string | null;
	fecha_creacion: string;
	total: number;
	observaciones: string | null;
	estado: EstadoVenta;
	fecha_pago: string | null;
}

export interface VentaInsert {
	id_cliente: number;
	observaciones: string | null;
}

export interface VentaUpdate {
	id_cliente?: number;
	observaciones?: string | null;
	estado?: EstadoVenta;
	fecha_pago?: string | null;
}

export interface VentaCompleta extends Venta {
	cliente: Cliente | null;
	venta_detalle: VentaDetalleCompleto[];
}