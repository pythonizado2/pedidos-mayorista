<script lang="ts">
	import { onMount } from 'svelte';

	import {
		actualizarCliente,
		cambiarEstadoCliente,
		crearCliente,
		eliminarCliente,
		obtenerClientes
	} from '$lib/services/cliente.service';

	import type {
		Cliente,
		ClienteInsert
	} from '$lib/types/clientes';

	let clientes = $state<Cliente[]>([]);

	let cargandoClientes = $state(true);
	let guardandoCliente = $state(false);
	let procesandoClienteId = $state<number | null>(null);

	let clienteEditandoId = $state<number | null>(null);

	let mensajeExito = $state('');
	let mensajeError = $state('');

	let formulario = $state<ClienteInsert>(crearFormularioVacio());

	function crearFormularioVacio(): ClienteInsert {
		return {
			nombre: '',
			apellido: null,
			telefono: null,
			direccion: null,
			observaciones: null,
			activo: true
		};
	}

	onMount(() => {
		cargarClientes();
	});

	async function cargarClientes(): Promise<void> {
		cargandoClientes = true;
		mensajeError = '';

		try {
			clientes = await obtenerClientes();
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudieron cargar los clientes.'
			);
		} finally {
			cargandoClientes = false;
		}
	}

	async function guardarCliente(): Promise<void> {
		mensajeExito = '';
		mensajeError = '';

		const nombre = formulario.nombre.trim();

		if (!nombre) {
			mensajeError = 'El nombre del cliente es obligatorio.';
			return;
		}

		const datosCliente: ClienteInsert = {
			nombre,
			apellido: normalizarTextoOpcional(formulario.apellido),
			telefono: normalizarTextoOpcional(formulario.telefono),
			direccion: normalizarTextoOpcional(formulario.direccion),
			observaciones: normalizarTextoOpcional(
				formulario.observaciones
			),
			activo: formulario.activo
		};

		guardandoCliente = true;

		try {
			if (clienteEditandoId === null) {
				const clienteCreado = await crearCliente(datosCliente);

				clientes = ordenarClientes([
					...clientes,
					clienteCreado
				]);

				mensajeExito = 'Cliente creado correctamente.';
			} else {
				const clienteActualizado = await actualizarCliente(
					clienteEditandoId,
					datosCliente
				);

				reemplazarClienteEnLista(clienteActualizado);

				mensajeExito = 'Cliente actualizado correctamente.';
			}

			cancelarEdicion();
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo guardar el cliente.'
			);
		} finally {
			guardandoCliente = false;
		}
	}

	function comenzarEdicion(cliente: Cliente): void {
		clienteEditandoId = cliente.id_cliente;

		formulario = {
			nombre: cliente.nombre,
			apellido: cliente.apellido,
			telefono: cliente.telefono,
			direccion: cliente.direccion,
			observaciones: cliente.observaciones,
			activo: cliente.activo
		};

		mensajeExito = '';
		mensajeError = '';

		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	function cancelarEdicion(): void {
		clienteEditandoId = null;
		formulario = crearFormularioVacio();
	}

	async function alternarEstado(cliente: Cliente): Promise<void> {
		mensajeExito = '';
		mensajeError = '';
		procesandoClienteId = cliente.id_cliente;

		try {
			const clienteActualizado = await cambiarEstadoCliente(
				cliente.id_cliente,
				!cliente.activo
			);

			reemplazarClienteEnLista(clienteActualizado);

			mensajeExito = clienteActualizado.activo
				? 'Cliente reactivado correctamente.'
				: 'Cliente desactivado correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo modificar el estado del cliente.'
			);
		} finally {
			procesandoClienteId = null;
		}
	}

	async function confirmarEliminacion(
		cliente: Cliente
	): Promise<void> {
		const nombreCompleto = obtenerNombreCompleto(cliente);

		const confirmado = window.confirm(
			`¿Realmente deseas eliminar a "${nombreCompleto}"? Esta acción no se puede deshacer.`
		);

		if (!confirmado) {
			return;
		}

		mensajeExito = '';
		mensajeError = '';
		procesandoClienteId = cliente.id_cliente;

		try {
			await eliminarCliente(cliente.id_cliente);

			clientes = clientes.filter(
				(item) => item.id_cliente !== cliente.id_cliente
			);

			if (clienteEditandoId === cliente.id_cliente) {
				cancelarEdicion();
			}

			mensajeExito = 'Cliente eliminado correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo eliminar el cliente.'
			);
		} finally {
			procesandoClienteId = null;
		}
	}

	function reemplazarClienteEnLista(
		clienteActualizado: Cliente
	): void {
		clientes = ordenarClientes(
			clientes.map((cliente) =>
				cliente.id_cliente === clienteActualizado.id_cliente
					? clienteActualizado
					: cliente
			)
		);
	}

	function ordenarClientes(lista: Cliente[]): Cliente[] {
		return [...lista].sort((a, b) => {
			const nombreA = obtenerNombreCompleto(a);
			const nombreB = obtenerNombreCompleto(b);

			return nombreA.localeCompare(nombreB);
		});
	}

	function obtenerNombreCompleto(cliente: Cliente): string {
		return [cliente.nombre, cliente.apellido]
			.filter(Boolean)
			.join(' ');
	}

	function normalizarTextoOpcional(
		valor: string | null
	): string | null {
		const texto = valor?.trim() ?? '';

		return texto === '' ? null : texto;
	}

	function obtenerMensajeError(
		error: unknown,
		mensajePredeterminado: string
	): string {
		return error instanceof Error
			? error.message
			: mensajePredeterminado;
	}
</script>

<svelte:head>
	
	<title>Clientes</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
<a href="/" class="text-sm font-medium text-gray-600 hover:text-gray-900">
		← Volver al menú	</a>
	<section
		class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">
				{clienteEditandoId === null
					? 'Crear cliente'
					: 'Editar cliente'}
			</h1>

			<p class="mt-1 text-sm text-gray-600">
				{clienteEditandoId === null
					? 'Registra un nuevo cliente.'
					: 'Modifica la información del cliente seleccionado.'}
			</p>
		</div>

		{#if mensajeExito}
			<div
				class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
			>
				{mensajeExito}
			</div>
		{/if}

		{#if mensajeError}
			<div
				class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
			>
				{mensajeError}
			</div>
		{/if}

		<form
			class="grid gap-4 md:grid-cols-2"
			onsubmit={(event) => {
				event.preventDefault();
				guardarCliente();
			}}
		>
			<div>
				<label
					for="nombre"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Nombre
				</label>

				<input
					id="nombre"
					type="text"
					bind:value={formulario.nombre}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div>
				<label
					for="apellido"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Apellido
				</label>

				<input
					id="apellido"
					type="text"
					bind:value={formulario.apellido}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div>
				<label
					for="telefono"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Teléfono
				</label>

				<input
					id="telefono"
					type="tel"
					bind:value={formulario.telefono}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div>
				<label
					for="direccion"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Dirección
				</label>

				<input
					id="direccion"
					type="text"
					bind:value={formulario.direccion}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div class="md:col-span-2">
				<label
					for="observaciones"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Observaciones
				</label>

				<textarea
					id="observaciones"
					rows="3"
					bind:value={formulario.observaciones}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				></textarea>
			</div>

			<div class="flex items-center gap-2 md:col-span-2">
				<input
					id="activo"
					type="checkbox"
					bind:checked={formulario.activo}
					class="h-4 w-4"
				/>

				<label for="activo" class="text-sm text-gray-700">
					Cliente activo
				</label>
			</div>

			<div
				class="flex flex-col gap-3 md:col-span-2 sm:flex-row"
			>
				<button
					type="submit"
					disabled={guardandoCliente}
					class="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if guardandoCliente}
						Guardando...
					{:else if clienteEditandoId === null}
						Guardar cliente
					{:else}
						Guardar cambios
					{/if}
				</button>

				{#if clienteEditandoId !== null}
					<button
						type="button"
						onclick={cancelarEdicion}
						disabled={guardandoCliente}
						class="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100"
					>
						Cancelar edición
					</button>
				{/if}
			</div>
		</form>
	</section>

	<section
		class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<div class="mb-5">
			<h2 class="text-xl font-bold text-gray-900">
				Clientes registrados
			</h2>

			<p class="mt-1 text-sm text-gray-600">
				Total: {clientes.length}
			</p>
		</div>

		{#if cargandoClientes}
			<p class="text-gray-600">Cargando clientes...</p>
		{:else if clientes.length === 0}
			<p class="text-gray-600">
				No hay clientes registrados.
			</p>
		{:else}
			<div class="overflow-x-auto">
				<table
					class="w-full min-w-[900px] border-collapse text-left"
				>
					<thead>
						<tr
							class="border-b border-gray-200 text-sm text-gray-600"
						>
							<th class="px-3 py-3">Cliente</th>
							<th class="px-3 py-3">Teléfono</th>
							<th class="px-3 py-3">Dirección</th>
							<th class="px-3 py-3">Estado</th>
							<th class="px-3 py-3 text-right">
								Acciones
							</th>
						</tr>
					</thead>

					<tbody>
						{#each clientes as cliente (cliente.id_cliente)}
							<tr
								class:opacity-60={!cliente.activo}
								class="border-b border-gray-100"
							>
								<td
									class="px-3 py-4 font-medium text-gray-900"
								>
									{obtenerNombreCompleto(cliente)}
								</td>

								<td class="px-3 py-4 text-gray-700">
									{cliente.telefono ?? 'Sin teléfono'}
								</td>

								<td class="px-3 py-4 text-gray-700">
									{cliente.direccion ?? 'Sin dirección'}
								</td>

								<td class="px-3 py-4">
									<span
										class="rounded-full px-2.5 py-1 text-xs font-medium"
										class:bg-green-100={cliente.activo}
										class:text-green-800={cliente.activo}
										class:bg-gray-200={!cliente.activo}
										class:text-gray-700={!cliente.activo}
									>
										{cliente.activo
											? 'Activo'
											: 'Inactivo'}
									</span>
								</td>

								<td class="px-3 py-4">
									<div class="flex justify-end gap-2">
										<button
											type="button"
											onclick={() =>
												comenzarEdicion(cliente)}
											disabled={procesandoClienteId ===
												cliente.id_cliente}
											class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
										>
											Editar
										</button>

										<button
											type="button"
											onclick={() =>
												alternarEstado(cliente)}
											disabled={procesandoClienteId ===
												cliente.id_cliente}
											class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
										>
											{cliente.activo
												? 'Desactivar'
												: 'Reactivar'}
										</button>

										<button
											type="button"
											onclick={() =>
												confirmarEliminacion(cliente)}
											disabled={procesandoClienteId ===
												cliente.id_cliente}
											class="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
										>
											{procesandoClienteId ===
											cliente.id_cliente
												? 'Procesando...'
												: 'Eliminar'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</main>