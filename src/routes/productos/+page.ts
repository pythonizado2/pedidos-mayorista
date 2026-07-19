import { supabase } from '$lib/supabase';
import type { Producto } from '$lib/types/productos';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const { data, error } = await supabase
		.from('producto')
		.select('*')
		.eq('activo', true)
		.order('nombre');

	if (error) {
		console.error('Error al obtener productos:', error.message);

		return {
			productos: [] as Producto[],
			error: 'No fue posible obtener los productos.'
		};
	}

	return {
		productos: (data ?? []) as Producto[],
		error: null
	};
};