import { supabase } from '$lib/supabase';

import type {
	EstadoVenta,
	VentaCompleta,
	VentaUpdate
} from '$lib/types/venta';

import type {
	VentaDetalleInsert
} from '$lib/types/ventaDetalle';

export async function obtenerVentas(): Promise<VentaCompleta[]> {
	const { data, error } = await supabase
		.from('venta')
		.select(`
			*,
			cliente (
				*
			),
			venta_detalle (
				*,
				producto (
					*
				)
			)
		`)
		.order('fecha_creacion', { ascending: false });

	if (error) {
		throw new Error(
			`Error al obtener las ventas: ${error.message}`
		);
	}

	return (data ?? []) as VentaCompleta[];
}

export async function obtenerVentaPorId(
	idVenta: number
): Promise<VentaCompleta> {
	const { data, error } = await supabase
		.from('venta')
		.select(`
			*,
			cliente (
				*
			),
			venta_detalle (
				*,
				producto (
					*
				)
			)
		`)
		.eq('id_venta', idVenta)
		.single();

	if (error) {
		throw new Error(
			`Error al obtener la venta: ${error.message}`
		);
	}

	return data as VentaCompleta;
}

export async function crearVenta(
	idCliente: number,
	observaciones: string | null,
	detalles: VentaDetalleInsert[]
): Promise<VentaCompleta> {
	const { data, error } = await supabase.rpc(
		'crear_venta',
		{
			p_id_cliente: idCliente,
			p_observaciones: observaciones,
			p_detalles: detalles
		}
	);

	if (error) {
		throw new Error(
			`Error al crear la venta: ${error.message}`
		);
	}

	const idVenta = Number(data);

	if (!Number.isInteger(idVenta)) {
		throw new Error(
			'La base de datos no devolvió una venta válida.'
		);
	}

	return obtenerVentaPorId(idVenta);
}

export async function actualizarVenta(
	idVenta: number,
	cambios: VentaUpdate
): Promise<VentaCompleta> {
	const { error } = await supabase
		.from('venta')
		.update(cambios)
		.eq('id_venta', idVenta);

	if (error) {
		throw new Error(
			`Error al actualizar la venta: ${error.message}`
		);
	}

	return obtenerVentaPorId(idVenta);
}

export async function cambiarEstadoVenta(
	idVenta: number,
	estado: EstadoVenta
): Promise<VentaCompleta> {
	const cambios: VentaUpdate = {
		estado
	};

	if (estado === 'CONFIRMADA') {
		cambios.fecha_pago = new Date().toISOString();
	}

	if (estado === 'BORRADOR') {
		cambios.fecha_pago = null;
	}

	return actualizarVenta(idVenta, cambios);
}

export async function eliminarVenta(
	idVenta: number
): Promise<void> {
	const { error } = await supabase
		.from('venta')
		.delete()
		.eq('id_venta', idVenta)
		.eq('estado', 'BORRADOR');

	if (error) {
		throw new Error(
			`Error al eliminar la venta: ${error.message}`
		);
	}
}