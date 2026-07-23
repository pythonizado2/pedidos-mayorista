<script lang="ts">
	import { onMount } from 'svelte';

	import {
		cambiarEstadoVenta,
		eliminarVenta,
		obtenerVentas
	} from '$lib/services/venta.service';

	import type {
		EstadoVenta,
		VentaCompleta
	} from '$lib/types/venta';

	let ventas = $state<VentaCompleta[]>([]);
	let cargandoVentas = $state(true);
	let procesandoVentaId = $state<number | null>(null);

	let mensajeExito = $state('');
	let mensajeError = $state('');

	const formatoMoneda = new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency: 'UYU'
	});

	const formatoFecha = new Intl.DateTimeFormat('es-UY', {
		dateStyle: 'short',
		timeStyle: 'short'
	});

	onMount(() => {
		cargarVentas();
	});

	async function cargarVentas(): Promise<void> {
		cargandoVentas = true;
		mensajeError = '';

		try {
			ventas = await obtenerVentas();
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudieron cargar las ventas.'
			);
		} finally {
			cargandoVentas = false;
		}
	}

	async function modificarEstado(
		venta: VentaCompleta,
		nuevoEstado: EstadoVenta
	): Promise<void> {
		const mensajes: Record<EstadoVenta, string> = {
			BORRADOR: '¿Deseas volver esta venta a borrador?',
			CONFIRMADA: '¿Deseas confirmar esta venta?',
			CANCELADA: '¿Deseas cancelar esta venta?'
		};

		if (!window.confirm(mensajes[nuevoEstado])) {
			return;
		}

		procesandoVentaId = venta.id_venta;
		mensajeExito = '';
		mensajeError = '';

		try {
			const ventaActualizada = await cambiarEstadoVenta(
				venta.id_venta,
				nuevoEstado
			);

			reemplazarVentaEnLista(ventaActualizada);

			mensajeExito = `La venta #${venta.id_venta} fue actualizada correctamente.`;
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo actualizar el estado de la venta.'
			);
		} finally {
			procesandoVentaId = null;
		}
	}

	async function confirmarEliminacion(
		venta: VentaCompleta
	): Promise<void> {
		if (venta.estado !== 'BORRADOR') {
			mensajeError =
				'Solo se pueden eliminar ventas en estado BORRADOR.';
			return;
		}

		const confirmado = window.confirm(
			`¿Deseas eliminar la venta #${venta.id_venta}? Esta acción eliminará también sus detalles.`
		);

		if (!confirmado) {
			return;
		}

		procesandoVentaId = venta.id_venta;
		mensajeExito = '';
		mensajeError = '';

		try {
			await eliminarVenta(venta.id_venta);

			ventas = ventas.filter(
				(item) => item.id_venta !== venta.id_venta
			);

			mensajeExito = 'Venta eliminada correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo eliminar la venta.'
			);
		} finally {
			procesandoVentaId = null;
		}
	}

	function reemplazarVentaEnLista(
		ventaActualizada: VentaCompleta
	): void {
		ventas = ventas.map((venta) =>
			venta.id_venta === ventaActualizada.id_venta
				? ventaActualizada
				: venta
		);
	}

	function obtenerNombreCliente(venta: VentaCompleta): string {
		if (!venta.cliente) {
			return 'Cliente no disponible';
		}

		return [venta.cliente.nombre, venta.cliente.apellido]
			.filter(Boolean)
			.join(' ');
	}

	function formatearFecha(fecha: string | null): string {
		if (!fecha) {
			return 'Sin fecha';
		}

		return formatoFecha.format(new Date(fecha));
	}

	function formatearMoneda(valor: number): string {
		return formatoMoneda.format(Number(valor));
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
	<title>Ventas</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
	<header
	class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
>
	<div>
		<a
			href="/"
			class="text-sm font-medium text-gray-600 hover:text-gray-900"
		>
			← Volver al menú
		</a>

		<h1 class="mt-3 text-3xl font-bold text-gray-900">
			Ventas
		</h1>

		<p class="mt-1 text-gray-600">
			Consulta las ventas y los productos incluidos.
		</p>
	</div>

	<a
		href="/ventas/nueva"
		class="rounded-lg bg-gray-900 px-5 py-3 text-center font-medium text-white transition hover:bg-gray-700"
	>
		Nueva venta
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

	{#if cargandoVentas}
		<section
			class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
		>
			<p class="text-gray-600">Cargando ventas...</p>
		</section>
	{:else if ventas.length === 0}
		<section
			class="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
		>
			<p class="text-gray-600">
				Todavía no hay ventas registradas.
			</p>

			<a
				href="/ventas/nueva"
				class="mt-4 inline-block font-medium text-gray-900 underline"
			>
				Registrar la primera venta
			</a>
		</section>
	{:else}
		<div class="space-y-5">
			{#each ventas as venta (venta.id_venta)}
				<article
					class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
				>
					<header
						class="flex flex-col gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between"
					>
						<div>
							<div class="flex flex-wrap items-center gap-3">
								<h2 class="text-xl font-bold text-gray-900">
									Venta #{venta.id_venta}
								</h2>

								<span
									class={`rounded-full px-3 py-1 text-xs font-semibold ${obtenerClaseEstado(
										venta.estado
									)}`}
								>
									{venta.estado}
								</span>
							</div>

							<p class="mt-2 font-medium text-gray-800">
								{obtenerNombreCliente(venta)}
							</p>

							<p class="mt-1 text-sm text-gray-500">
								Creada: {formatearFecha(
									venta.fecha_creacion
								)}
							</p>
						</div>

						<div class="md:text-right">
							<p class="text-sm text-gray-500">
								Total
							</p>

							<p class="text-2xl font-bold text-gray-900">
								{formatearMoneda(venta.total)}
							</p>
						</div>
					</header>

					<div class="p-5">
						<h3 class="mb-3 font-semibold text-gray-900">
							Productos
						</h3>

						{#if venta.venta_detalle.length === 0}
							<p class="text-sm text-gray-500">
								Esta venta no tiene detalles.
							</p>
						{:else}
							<div class="overflow-x-auto">
								<table
									class="w-full min-w-[650px] border-collapse text-left"
								>
									<thead>
										<tr
											class="border-b border-gray-200 text-sm text-gray-500"
										>
											<th class="px-3 py-2">
												Producto
											</th>
											<th class="px-3 py-2 text-right">
												Cantidad
											</th>
											<th class="px-3 py-2 text-right">
												Precio
											</th>
											<th class="px-3 py-2 text-right">
												Subtotal
											</th>
										</tr>
									</thead>

									<tbody>
										{#each venta.venta_detalle as detalle (detalle.id_venta_detalle)}
											<tr
												class="border-b border-gray-100"
											>
												<td class="px-3 py-3">
													{detalle.producto?.nombre ??
														'Producto no disponible'}
												</td>

												<td
													class="px-3 py-3 text-right"
												>
													{detalle.cantidad}
												</td>

												<td
													class="px-3 py-3 text-right"
												>
													{formatearMoneda(
														detalle.precio_unitario
													)}
												</td>

												<td
													class="px-3 py-3 text-right font-medium"
												>
													{formatearMoneda(
														detalle.subtotal
													)}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}

						{#if venta.observaciones}
							<div class="mt-5 rounded-lg bg-gray-50 p-4">
								<p class="text-sm font-medium text-gray-700">
									Observaciones
								</p>

								<p class="mt-1 text-sm text-gray-600">
									{venta.observaciones}
								</p>
							</div>
						{/if}

						<div class="mt-5 flex flex-wrap gap-2">
							<a
								href={`/ventas/${venta.id_venta}`}
								class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
							>
								Ver detalle
							</a>

							{#if venta.estado === 'BORRADOR'}
								<button
									type="button"
									onclick={() =>
										modificarEstado(
											venta,
											'CONFIRMADA'
										)}
									disabled={procesandoVentaId ===
										venta.id_venta}
									class="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
								>
									Confirmar
								</button>

								<button
									type="button"
									onclick={() =>
										modificarEstado(
											venta,
											'CANCELADA'
										)}
									disabled={procesandoVentaId ===
										venta.id_venta}
									class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
								>
									Cancelar
								</button>

								<button
									type="button"
									onclick={() =>
										confirmarEliminacion(venta)}
									disabled={procesandoVentaId ===
										venta.id_venta}
									class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
								>
									Eliminar
								</button>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</main>