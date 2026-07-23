import { supabase } from '$lib/supabase';

import type {
	Producto,
	ProductoInsert,
	ProductoUpdate
} from '$lib/types/productos';

/**
 * Obtiene todos los productos.
 */
export async function obtenerProductos(): Promise<Producto[]> {
	const { data, error } = await supabase
		.from('producto')
		.select('*')
		.order('nombre', { ascending: true });

	if (error) {
		throw new Error(`Error al obtener los productos: ${error.message}`);
	}

	return (data ?? []) as Producto[];
}

/**
 * Crea un nuevo producto.
 */
export async function crearProducto(
	nuevoProducto: ProductoInsert
): Promise<Producto> {
	const { data, error } = await supabase
		.from('producto')
		.insert(nuevoProducto)
		.select()
		.single();

	if (error) {
		throw new Error(`Error al crear el producto: ${error.message}`);
	}

	if (!data) {
		throw new Error('Supabase no devolvió el producto creado.');
	}

	return data as Producto;
}

/**
 * Actualiza los datos de un producto.
 */
export async function actualizarProducto(
	idProducto: number,
	cambios: ProductoUpdate
): Promise<Producto> {
	const { data, error } = await supabase
		.from('producto')
		.update(cambios)
		.eq('id_producto', idProducto)
		.select()
		.single();

	if (error) {
		throw new Error(`Error al actualizar el producto: ${error.message}`);
	}

	if (!data) {
		throw new Error('Supabase no devolvió el producto actualizado.');
	}

	return data as Producto;
}

/**
 * Activa o desactiva un producto.
 */
export async function cambiarEstadoProducto(
	idProducto: number,
	activo: boolean
): Promise<Producto> {
	return actualizarProducto(idProducto, { activo });
}

/**
 * Elimina físicamente un producto.
 */
export async function eliminarProducto(
	idProducto: number
): Promise<void> {
	const { error } = await supabase
		.from('producto')
		.delete()
		.eq('id_producto', idProducto);

	if (error) {
		throw new Error(`Error al eliminar el producto: ${error.message}`);
	}
}