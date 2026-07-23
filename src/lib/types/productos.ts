export type TipoVenta = 'UNIDAD' | 'PESO';

export interface Producto {
	id_producto: number;
	nombre: string;
	descripcion: string | null;
	categoria: string | null;
	tipo_venta: TipoVenta;
	precio: number;
	activo: boolean;
	fecha_creacion: string;
}

export interface ProductoInsert {
	nombre: string;
	descripcion: string | null;
	categoria: string | null;
	tipo_venta: TipoVenta;
	precio: number;
	activo: boolean;
}

export interface ProductoUpdate {
	nombre?: string;
	descripcion?: string | null;
	categoria?: string | null;
	tipo_venta?: TipoVenta;
	precio?: number;
	activo?: boolean;
}