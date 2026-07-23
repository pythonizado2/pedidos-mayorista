<script lang="ts">
	import { goto } from '$app/navigation';

	import { iniciarSesion } from '$lib/services/auth.service';

	let email = $state('');
	let password = $state('');

	let iniciandoSesion = $state(false);
	let mensajeError = $state('');

	async function enviarFormulario(): Promise<void> {
		mensajeError = '';

		const emailNormalizado = email.trim().toLowerCase();

		if (!emailNormalizado) {
			mensajeError = 'Debes ingresar tu correo electrónico.';
			return;
		}

		if (!password) {
			mensajeError = 'Debes ingresar tu contraseña.';
			return;
		}

		iniciandoSesion = true;

		try {
			await iniciarSesion(emailNormalizado, password);

			await goto('/');
		} catch (error) {
			mensajeError =
				error instanceof Error
					? error.message
					: 'No se pudo iniciar sesión.';
		} finally {
			iniciandoSesion = false;
		}
	}
</script>

<svelte:head>
	<title>Iniciar sesión</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
	<section
		class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">
				Iniciar sesión
			</h1>

			<p class="mt-1 text-sm text-gray-600">
				Ingresa con tu usuario de vendedor.
			</p>
		</header>

		{#if mensajeError}
			<div
				class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
			>
				{mensajeError}
			</div>
		{/if}

		<form
			class="space-y-4"
			onsubmit={(event) => {
				event.preventDefault();
				enviarFormulario();
			}}
		>
			<div>
				<label
					for="email"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Correo electrónico
				</label>

				<input
					id="email"
					type="email"
					bind:value={email}
					autocomplete="email"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Contraseña
				</label>

				<input
					id="password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
				/>
			</div>

			<button
				type="submit"
				disabled={iniciandoSesion}
				class="w-full rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{iniciandoSesion
					? 'Ingresando...'
					: 'Iniciar sesión'}
			</button>
		</form>
	</section>
</main>