<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { obtenerClientes } from '$lib/services/cliente.service';
	import { obtenerProductos } from '$lib/services/producto.service';
	import { crearVenta } from '$lib/services/venta.service';

	import type { Cliente } from '$lib/types/clientes';
	import type { Producto } from '$lib/types/productos';
	import type { VentaDetalleInsert } from '$lib/types/ventaDetalle';

	interface ProductoSeleccionado {
		producto: Producto;
		cantidad: number;
	}

	let clientes = $state<Cliente[]>([]);
	let productos = $state<Producto[]>([]);
	let productosSeleccionados = $state<ProductoSeleccionado[]>([]);

	let idClienteSeleccionado = $state('');
	let idProductoSeleccionado = $state('');
	let cantidadSeleccionada = $state(1);
	let observaciones = $state('');

	let cargandoDatos = $state(true);
	let guardandoVenta = $state(false);

	let mensajeError = $state('');

	const formatoMoneda = new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency: 'UYU'
	});

	let totalVenta = $derived(
		productosSeleccionados.reduce(
			(total, item) =>
				total +
				Number(item.producto.precio) *
					Number(item.cantidad),
			0
		)
	);

	onMount(() => {
		cargarDatos();
	});

	async function cargarDatos(): Promise<void> {
		cargandoDatos = true;
		mensajeError = '';

		try {
			const [clientesObtenidos, productosObtenidos] =
				await Promise.all([
					obtenerClientes(),
					obtenerProductos()
				]);

			clientes = clientesObtenidos.filter(
				(cliente) => cliente.activo
			);

			productos = productosObtenidos.filter(
				(producto) => producto.activo
			);
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudieron cargar los datos.'
			);
		} finally {
			cargandoDatos = false;
		}
	}

	function agregarProducto(): void {
		mensajeError = '';

		const idProducto = Number(idProductoSeleccionado);
		const cantidad = Number(cantidadSeleccionada);

		if (!Number.isInteger(idProducto)) {
			mensajeError = 'Debes seleccionar un producto.';
			return;
		}

		if (!Number.isFinite(cantidad) || cantidad <= 0) {
			mensajeError =
				'La cantidad debe ser un número mayor que cero.';
			return;
		}

		const producto = productos.find(
			(item) => item.id_producto === idProducto
		);

		if (!producto) {
			mensajeError = 'El producto seleccionado no existe.';
			return;
		}

		const productoYaSeleccionado =
			productosSeleccionados.find(
				(item) =>
					item.producto.id_producto === idProducto
			);

		if (productoYaSeleccionado) {
			productosSeleccionados =
				productosSeleccionados.map((item) =>
					item.producto.id_producto === idProducto
						? {
								...item,
								cantidad:
									Number(item.cantidad) +
									cantidad
							}
						: item
				);
		} else {
			productosSeleccionados = [
				...productosSeleccionados,
				{
					producto,
					cantidad
				}
			];
		}

		idProductoSeleccionado = '';
		cantidadSeleccionada = 1;
	}

	function actualizarCantidad(
		idProducto: number,
		nuevaCantidad: number
	): void {
		if (
			!Number.isFinite(nuevaCantidad) ||
			nuevaCantidad <= 0
		) {
			return;
		}

		productosSeleccionados =
			productosSeleccionados.map((item) =>
				item.producto.id_producto === idProducto
					? {
							...item,
							cantidad: nuevaCantidad
						}
					: item
			);
	}

	function quitarProducto(idProducto: number): void {
		productosSeleccionados =
			productosSeleccionados.filter(
				(item) =>
					item.producto.id_producto !== idProducto
			);
	}

	async function guardarVenta(): Promise<void> {
		mensajeError = '';

		const idCliente = Number(idClienteSeleccionado);

		if (!Number.isInteger(idCliente)) {
			mensajeError = 'Debes seleccionar un cliente.';
			return;
		}

		if (productosSeleccionados.length === 0) {
			mensajeError =
				'Debes agregar al menos un producto a la venta.';
			return;
		}

		const detalles: VentaDetalleInsert[] =
			productosSeleccionados.map((item) => ({
				id_producto: item.producto.id_producto,
				cantidad: Number(item.cantidad)
			}));

		guardandoVenta = true;

		try {
			const ventaCreada = await crearVenta(
				idCliente,
				normalizarTextoOpcional(observaciones),
				detalles
			);

			await goto(`/ventas/${ventaCreada.id_venta}`);
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo registrar la venta.'
			);
		} finally {
			guardandoVenta = false;
		}
	}

	function obtenerNombreCliente(cliente: Cliente): string {
		return [cliente.nombre, cliente.apellido]
			.filter(Boolean)
			.join(' ');
	}

	function obtenerPasoCantidad(producto: Producto): number {
		return producto.tipo_venta === 'PESO' ? 0.01 : 1;
	}

	function formatearMoneda(valor: number): string {
		return formatoMoneda.format(Number(valor));
	}

	function normalizarTextoOpcional(
		valor: string
	): string | null {
		const texto = valor.trim();

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
	<title>Nueva venta</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
	<header>
		<a
			href="/ventas"
			class="text-sm font-medium text-gray-600 hover:text-gray-900"
		>
			← Volver a ventas
		</a>

		<h1 class="mt-3 text-3xl font-bold text-gray-900">
			Nueva venta
		</h1>

		<p class="mt-1 text-gray-600">
			Selecciona un cliente y agrega los productos.
		</p>
	</header>

	{#if mensajeError}
		<div
			class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
		>
			{mensajeError}
		</div>
	{/if}

	{#if cargandoDatos}
		<section
			class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
		>
			<p class="text-gray-600">
				Cargando clientes y productos...
			</p>
		</section>
	{:else}
		<form
			class="space-y-6"
			onsubmit={(event) => {
				event.preventDefault();
				guardarVenta();
			}}
		>
			<section
				class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
			>
				<h2 class="mb-5 text-xl font-bold text-gray-900">
					Datos de la venta
				</h2>

				<div class="grid gap-5 md:grid-cols-2">
					<div>
						<label
							for="cliente"
							class="mb-1 block text-sm font-medium text-gray-700"
						>
							Cliente
						</label>

						<select
							id="cliente"
							bind:value={idClienteSeleccionado}
							required
							class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
						>
							<option value="">
								Seleccionar cliente
							</option>

							{#each clientes as cliente (cliente.id_cliente)}
								<option value={cliente.id_cliente}>
									{obtenerNombreCliente(cliente)}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="observaciones"
							class="mb-1 block text-sm font-medium text-gray-700"
						>
							Observaciones
						</label>

						<input
							id="observaciones"
							type="text"
							bind:value={observaciones}
							placeholder="Información adicional"
							class="w-full rounded-lg border border-gray-300 px-3 py-2.5"
						/>
					</div>
				</div>
			</section>

			<section
				class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
			>
				<h2 class="mb-5 text-xl font-bold text-gray-900">
					Agregar producto
				</h2>

				<div
					class="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end"
				>
					<div>
						<label
							for="producto"
							class="mb-1 block text-sm font-medium text-gray-700"
						>
							Producto
						</label>

						<select
							id="producto"
							bind:value={idProductoSeleccionado}
							class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
						>
							<option value="">
								Seleccionar producto
							</option>

							{#each productos as producto (producto.id_producto)}
								<option value={producto.id_producto}>
									{producto.nombre} —
									{formatearMoneda(
										producto.precio
									)}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="cantidad"
							class="mb-1 block text-sm font-medium text-gray-700"
						>
							Cantidad
						</label>

						<input
							id="cantidad"
							type="number"
							min="0.01"
							step="0.01"
							bind:value={cantidadSeleccionada}
							class="w-full rounded-lg border border-gray-300 px-3 py-2.5"
						/>
					</div>

					<button
						type="button"
						onclick={agregarProducto}
						class="rounded-lg bg-gray-800 px-5 py-2.5 font-medium text-white hover:bg-gray-700"
					>
						Agregar
					</button>
				</div>
			</section>

			<section
				class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
			>
				<div
					class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
				>
					<h2 class="text-xl font-bold text-gray-900">
						Detalle de la venta
					</h2>

					<p class="text-2xl font-bold text-gray-900">
						{formatearMoneda(totalVenta)}
					</p>
				</div>

				{#if productosSeleccionados.length === 0}
					<div
						class="rounded-lg border border-dashed border-gray-300 p-8 text-center"
					>
						<p class="text-gray-500">
							Todavía no agregaste productos.
						</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table
							class="w-full min-w-[750px] border-collapse text-left"
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
										Precio
									</th>
									<th class="px-3 py-3 text-right">
										Cantidad
									</th>
									<th class="px-3 py-3 text-right">
										Subtotal
									</th>
									<th class="px-3 py-3"></th>
								</tr>
							</thead>

							<tbody>
								{#each productosSeleccionados as item (item.producto.id_producto)}
									<tr
										class="border-b border-gray-100"
									>
										<td
											class="px-3 py-4 font-medium text-gray-900"
										>
											{item.producto.nombre}
										</td>

										<td class="px-3 py-4">
											{item.producto.tipo_venta}
										</td>

										<td
											class="px-3 py-4 text-right"
										>
											{formatearMoneda(
												item.producto.precio
											)}
										</td>

										<td
											class="px-3 py-4 text-right"
										>
											<input
												type="number"
												min={obtenerPasoCantidad(
													item.producto
												)}
												step={obtenerPasoCantidad(
													item.producto
												)}
												value={item.cantidad}
												onchange={(event) =>
													actualizarCantidad(
														item.producto
															.id_producto,
														Number(
															event
																.currentTarget
																.value
														)
													)}
												class="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-right"
											/>
										</td>

										<td
											class="px-3 py-4 text-right font-medium"
										>
											{formatearMoneda(
												Number(
													item.producto.precio
												) *
													Number(
														item.cantidad
													)
											)}
										</td>

										<td
											class="px-3 py-4 text-right"
										>
											<button
												type="button"
												onclick={() =>
													quitarProducto(
														item.producto
															.id_producto
													)}
												class="font-medium text-red-700 hover:underline"
											>
												Quitar
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<div class="flex flex-col gap-3 sm:flex-row">
				<button
					type="submit"
					disabled={guardandoVenta ||
						productosSeleccionados.length === 0}
					class="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{guardandoVenta
						? 'Guardando venta...'
						: 'Guardar venta'}
				</button>

				<a
					href="/ventas"
					class="rounded-lg border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-100"
				>
					Cancelar
				</a>
			</div>
		</form>
	{/if}
</main>