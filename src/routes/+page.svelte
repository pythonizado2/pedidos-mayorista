<script lang="ts">
	import { goto } from '$app/navigation';
	import { cerrarSesion, obtenerUsuarioActual } from '$lib/services/auth.service';
	import { onMount } from 'svelte';

	let correoUsuario = $state('');
	let cargando = $state(true);
	let cerrandoSesion = $state(false);
	let mensajeError = $state('');

	onMount(() => {
		comprobarUsuario();
	});

	async function comprobarUsuario(): Promise<void> {
		try {
			const usuario = await obtenerUsuarioActual();

			if (!usuario) {
				await goto('/login');
				return;
			}

			correoUsuario = usuario.email ?? '';
		} catch (error) {
			mensajeError =
				error instanceof Error
					? error.message
					: 'No se pudo comprobar la sesión.';

			await goto('/login');
		} finally {
			cargando = false;
		}
	}

	async function salir(): Promise<void> {
		cerrandoSesion = true;
		mensajeError = '';

		try {
			await cerrarSesion();
			await goto('/login');
		} catch (error) {
			mensajeError =
				error instanceof Error
					? error.message
					: 'No se pudo cerrar la sesión.';
		} finally {
			cerrandoSesion = false;
		}
	}
</script>

<svelte:head>
	<title>Menú principal</title>
</svelte:head>

<main class="min-h-screen bg-gray-100 p-4 md:p-8">
	<div class="mx-auto max-w-5xl">
		{#if cargando}
			<section class="rounded-xl bg-white p-6 shadow-sm">
				<p class="text-gray-600">Cargando menú...</p>
			</section>
		{:else}
			<header
				class="mb-8 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					<h1 class="text-3xl font-bold text-gray-900">
						Menú principal
					</h1>

					<p class="mt-1 text-gray-600">
						Selecciona el módulo al que deseas ingresar.
					</p>

					{#if correoUsuario}
						<p class="mt-2 text-sm text-gray-500">
							Usuario: {correoUsuario}
						</p>
					{/if}
				</div>

				<button
					type="button"
					onclick={salir}
					disabled={cerrandoSesion}
					class="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión'}
				</button>
			</header>

			{#if mensajeError}
				<div
					class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
				>
					{mensajeError}
				</div>
			{/if}

			<section class="grid gap-5 md:grid-cols-3">
				<a
					href="/ventas"
					class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
				>
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-xl text-white"
					>
						$
					</div>

					<h2 class="text-xl font-bold text-gray-900">
						Ventas
					</h2>

					<p class="mt-2 text-gray-600">
						Registrar nuevas ventas y consultar las ventas realizadas.
					</p>

					<p class="mt-5 font-medium text-gray-900 group-hover:underline">
						Ingresar a ventas →
					</p>
				</a>

				<a
					href="/productos"
					class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
				>
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-xl text-white"
					>
						P
					</div>

					<h2 class="text-xl font-bold text-gray-900">
						Productos
					</h2>

					<p class="mt-2 text-gray-600">
						Crear, modificar, activar y desactivar productos.
					</p>

					<p class="mt-5 font-medium text-gray-900 group-hover:underline">
						Ingresar a productos →
					</p>
				</a>

				<a
					href="/clientes"
					class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
				>
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-xl text-white"
					>
						C
					</div>

					<h2 class="text-xl font-bold text-gray-900">
						Clientes
					</h2>

					<p class="mt-2 text-gray-600">
						Registrar y administrar los datos de los clientes.
					</p>

					<p class="mt-5 font-medium text-gray-900 group-hover:underline">
						Ingresar a clientes →
					</p>
				</a>
			</section>
		{/if}
	</div>
</main>