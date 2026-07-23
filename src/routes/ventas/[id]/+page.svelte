<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import {
		cambiarEstadoVenta,
		eliminarVenta,
		obtenerVentaPorId
	} from '$lib/services/venta.service';

	import type {
		EstadoVenta,
		VentaCompleta
	} from '$lib/types/venta';

	const idVenta = $derived(Number(page.params.id));

	let venta = $state<VentaCompleta | null>(null);
	let cargandoVenta = $state(true);
	let procesandoVenta = $state(false);

	let mensajeExito = $state('');
	let mensajeError = $state('');

	const formatoMoneda = new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency: 'UYU'
	});

	const formatoFecha = new Intl.DateTimeFormat('es-UY', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	onMount(() => {
		cargarVenta();
	});

	async function cargarVenta(): Promise<void> {
		cargandoVenta = true;
		mensajeError = '';

		if (!Number.isInteger(idVenta) || idVenta <= 0) {
			mensajeError = 'El identificador de la venta no es válido.';
			cargandoVenta = false;
			return;
		}

		try {
			venta = await obtenerVentaPorId(idVenta);
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo cargar la venta.'
			);
		} finally {
			cargandoVenta = false;
		}
	}

	async function modificarEstado(
		nuevoEstado: EstadoVenta
	): Promise<void> {
		if (!venta) {
			return;
		}

		const mensajes: Record<EstadoVenta, string> = {
			BORRADOR: '¿Deseas volver esta venta a borrador?',
			CONFIRMADA: '¿Deseas confirmar esta venta?',
			CANCELADA: '¿Deseas cancelar esta venta?'
		};

		if (!window.confirm(mensajes[nuevoEstado])) {
			return;
		}

		procesandoVenta = true;
		mensajeExito = '';
		mensajeError = '';

		try {
			venta = await cambiarEstadoVenta(
				venta.id_venta,
				nuevoEstado
			);

			mensajeExito =
				'El estado de la venta se actualizó correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo actualizar la venta.'
			);
		} finally {
			procesandoVenta = false;
		}
	}

	async function confirmarEliminacion(): Promise<void> {
		if (!venta) {
			return;
		}

		if (venta.estado !== 'BORRADOR') {
			mensajeError =
				'Solo se pueden eliminar ventas en estado BORRADOR.';
			return;
		}

		const confirmado = window.confirm(
			`¿Deseas eliminar la venta #${venta.id_venta}? Esta acción no se puede deshacer.`
		);

		if (!confirmado) {
			return;
		}

		procesandoVenta = true;
		mensajeExito = '';
		mensajeError = '';

		try {
			await eliminarVenta(venta.id_venta);
			await goto('/ventas');
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo eliminar la venta.'
			);

			procesandoVenta = false;
		}
	}

	function obtenerNombreCliente(): string {
		if (!venta?.cliente) {
			return 'Cliente no disponible';
		}

		return [
			venta.cliente.nombre,
			venta.cliente.apellido
		]
			.filter(Boolean)
			.join(' ');
	}

	function obtenerClaseEstado(estado: EstadoVenta): string {
		switch (estado) {
			case 'CONFIRMADA':
				return 'bg-green-100 text-green-800';

			case 'CANCELADA':
				return 'bg-red-100 text-red-800';

			default:
				return 'bg-yellow-100 text-yellow-800';
		}
	}

	function formatearMoneda(valor: number): string {
		return formatoMoneda.format(Number(valor));
	}

	function formatearFecha(fecha: string | null): string {
		if (!fecha) {
			return 'Sin fecha';
		}

		return formatoFecha.format(new Date(fecha));
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
	<title>
		{venta ? `Venta #${venta.id_venta}` : 'Detalle de venta'}
	</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
	<header>
		<a
			href="/ventas"
			class="text-sm font-medium text-gray-600 hover:text-gray-900"
		>
			← Volver a ventas
		</a>
	</header>

	{#if mensajeExito}
		<div
			class="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
		>
			{mensajeExito}
		</div>
	{/if}

	{#if mensajeError}
		<div
			class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
		>
			{mensajeError}
		</div>
	{/if}

	{#if cargandoVenta}
		<section
			class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
		>
			<p class="text-gray-600">Cargando venta...</p>
		</section>
	{:else if venta}
		<section
			class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
		>
			<header
				class="flex flex-col gap-5 border-b border-gray-200 p-6 md:flex-row md:items-start md:justify-between"
			>
				<div>
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-3xl font-bold text-gray-900">
							Venta #{venta.id_venta}
						</h1>

						<span
							class={`rounded-full px-3 py-1 text-sm font-semibold ${obtenerClaseEstado(
								venta.estado
							)}`}
						>
							{venta.estado}
						</span>
					</div>

					<p class="mt-4 text-lg font-medium text-gray-800">
						{obtenerNombreCliente()}
					</p>

					{#if venta.cliente?.telefono}
						<p class="mt-1 text-gray-600">
							Teléfono: {venta.cliente.telefono}
						</p>
					{/if}

					{#if venta.cliente?.direccion}
						<p class="mt-1 text-gray-600">
							Dirección: {venta.cliente.direccion}
						</p>
					{/if}

					<p class="mt-3 text-sm text-gray-500">
						Creada: {formatearFecha(
							venta.fecha_creacion
						)}
					</p>

					{#if venta.fecha_pago}
						<p class="mt-1 text-sm text-gray-500">
							Confirmada: {formatearFecha(
								venta.fecha_pago
							)}
						</p>
					{/if}
				</div>

				<div class="md:text-right">
					<p class="text-sm text-gray-500">
						Total de la venta
					</p>

					<p class="text-3xl font-bold text-gray-900">
						{formatearMoneda(venta.total)}
					</p>
				</div>
			</header>

			<div class="p-6">
				<h2 class="mb-4 text-xl font-bold text-gray-900">
					Detalle de productos
				</h2>

				{#if venta.venta_detalle.length === 0}
					<p class="text-gray-500">
						La venta no tiene productos registrados.
					</p>
				{:else}
					<div class="overflow-x-auto">
						<table
							class="w-full min-w-[700px] border-collapse text-left"
						>
							<thead>
								<tr
									class="border-b border-gray-200 text-sm text-gray-500"
								>
									<th class="px-3 py-3">
										Producto
									</th>
									<th class="px-3 py-3">
										Tipo
									</th>
									<th class="px-3 py-3 text-right">
										Cantidad
									</th>
									<th class="px-3 py-3 text-right">
										Precio unitario
									</th>
									<th class="px-3 py-3 text-right">
										Subtotal
									</th>
								</tr>
							</thead>

							<tbody>
								{#each venta.venta_detalle as detalle (detalle.id_venta_detalle)}
									<tr
										class="border-b border-gray-100"
									>
										<td
											class="px-3 py-4 font-medium text-gray-900"
										>
											{detalle.producto?.nombre ??
												'Producto no disponible'}
										</td>

										<td class="px-3 py-4">
											{detalle.producto
												?.tipo_venta ?? '—'}
										</td>

										<td
											class="px-3 py-4 text-right"
										>
											{detalle.cantidad}
										</td>

										<td
											class="px-3 py-4 text-right"
										>
											{formatearMoneda(
												detalle.precio_unitario
											)}
										</td>

										<td
											class="px-3 py-4 text-right font-semibold"
										>
											{formatearMoneda(
												detalle.subtotal
											)}
										</td>
									</tr>
								{/each}
							</tbody>

							<tfoot>
								<tr>
									<td
										colspan="4"
										class="px-3 py-5 text-right text-lg font-bold"
									>
										Total
									</td>

									<td
										class="px-3 py-5 text-right text-xl font-bold"
									>
										{formatearMoneda(
											venta.total
										)}
									</td>
								</tr>
							</tfoot>
						</table>
					</div>
				{/if}

				{#if venta.observaciones}
					<div class="mt-6 rounded-lg bg-gray-50 p-4">
						<p class="font-medium text-gray-800">
							Observaciones
						</p>

						<p class="mt-1 text-gray-600">
							{venta.observaciones}
						</p>
					</div>
				{/if}

				<div class="mt-6 flex flex-wrap gap-3">
					{#if venta.estado === 'BORRADOR'}
						<button
							type="button"
							onclick={() =>
								modificarEstado('CONFIRMADA')}
							disabled={procesandoVenta}
							class="rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white hover:bg-green-600 disabled:opacity-50"
						>
							Confirmar venta
						</button>

						<button
							type="button"
							onclick={() =>
								modificarEstado('CANCELADA')}
							disabled={procesandoVenta}
							class="rounded-lg border border-red-300 px-5 py-2.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
						>
							Cancelar venta
						</button>

						<button
							type="button"
							onclick={confirmarEliminacion}
							disabled={procesandoVenta}
							class="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
						>
							Eliminar venta
						</button>
					{/if}

					<a
						href="/ventas"
						class="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
					>
						Volver
					</a>
				</div>
			</div>
		</section>
	{:else if !mensajeError}
		<section
			class="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
		>
			<p class="text-gray-600">
				No se encontró la venta solicitada.
			</p>
		</section>
	{/if}
</main>