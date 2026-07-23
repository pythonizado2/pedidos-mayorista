import { supabase } from '$lib/supabase';

import type {
	Cliente,
	ClienteInsert,
	ClienteUpdate
} from '$lib/types/clientes';

/**
 * Obtiene todos los clientes.
 */
export async function obtenerClientes(): Promise<Cliente[]> {
	const { data, error } = await supabase
		.from('cliente')
		.select('*')
		.order('nombre', { ascending: true })
		.order('apellido', { ascending: true });

	if (error) {
		throw new Error(`Error al obtener los clientes: ${error.message}`);
	}

	return (data ?? []) as Cliente[];
}

/**
 * Crea un cliente.
 */
export async function crearCliente(
	nuevoCliente: ClienteInsert
): Promise<Cliente> {
	const { data, error } = await supabase
		.from('cliente')
		.insert(nuevoCliente)
		.select()
		.single();

	if (error) {
		throw new Error(`Error al crear el cliente: ${error.message}`);
	}

	if (!data) {
		throw new Error('Supabase no devolvió el cliente creado.');
	}

	return data as Cliente;
}

/**
 * Actualiza los datos de un cliente.
 */
export async function actualizarCliente(
	idCliente: number,
	cambios: ClienteUpdate
): Promise<Cliente> {
	const { data, error } = await supabase
		.from('cliente')
		.update(cambios)
		.eq('id_cliente', idCliente)
		.select()
		.single();

	if (error) {
		throw new Error(`Error al actualizar el cliente: ${error.message}`);
	}

	if (!data) {
		throw new Error('Supabase no devolvió el cliente actualizado.');
	}

	return data as Cliente;
}

/**
 * Activa o desactiva un cliente.
 */
export async function cambiarEstadoCliente(
	idCliente: number,
	activo: boolean
): Promise<Cliente> {
	return actualizarCliente(idCliente, { activo });
}

/**
 * Elimina físicamente un cliente.
 */
export async function eliminarCliente(
	idCliente: number
): Promise<void> {
	const { error } = await supabase
		.from('cliente')
		.delete()
		.eq('id_cliente', idCliente);

	if (error) {
		throw new Error(`Error al eliminar el cliente: ${error.message}`);
	}
}