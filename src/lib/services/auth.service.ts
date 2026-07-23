import { supabase } from '$lib/supabase';

export async function iniciarSesion(
	email: string,
	password: string
): Promise<void> {
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		throw new Error(`Error al iniciar sesión: ${error.message}`);
	}
}

export async function cerrarSesion(): Promise<void> {
	const { error } = await supabase.auth.signOut();

	if (error) {
		throw new Error(`Error al cerrar sesión: ${error.message}`);
	}
}

export async function obtenerUsuarioActual() {
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error) {
		throw new Error(
			`Error al obtener el usuario actual: ${error.message}`
		);
	}

	return user;
}

export async function obtenerSesionActual() {
	const {
		data: { session },
		error
	} = await supabase.auth.getSession();

	if (error) {
		throw new Error(
			`Error al obtener la sesión: ${error.message}`
		);
	}

	return session;
}