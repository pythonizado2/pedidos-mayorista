export interface Cliente {
	id_cliente: number;
	nombre: string;
	apellido: string | null;
	telefono: string | null;
	direccion: string | null;
	observaciones: string | null;
	activo: boolean;
	fecha_creacion: string;
}

export interface ClienteInsert {
	nombre: string;
	apellido: string | null;
	telefono: string | null;
	direccion: string | null;
	observaciones: string | null;
	activo: boolean;
}

export interface ClienteUpdate {
	nombre?: string;
	apellido?: string | null;
	telefono?: string | null;
	direccion?: string | null;
	observaciones?: string | null;
	activo?: boolean;
}