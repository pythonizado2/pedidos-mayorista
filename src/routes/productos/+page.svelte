<script lang="ts">
	import { onMount } from 'svelte';

	import {
		actualizarProducto,
		cambiarEstadoProducto,
		crearProducto,
		eliminarProducto,
		obtenerProductos
	} from '$lib/services/producto.service';

	import type {
		Producto,
		ProductoInsert,
		TipoVenta
	} from '$lib/types/productos';

	let productos = $state<Producto[]>([]);

	let cargandoProductos = $state(true);
	let guardandoProducto = $state(false);
	let procesandoProductoId = $state<number | null>(null);

	let productoEditandoId = $state<number | null>(null);

	let mensajeExito = $state('');
	let mensajeError = $state('');

	let formulario = $state<ProductoInsert>(crearFormularioVacio());

	function crearFormularioVacio(): ProductoInsert {
		return {
			nombre: '',
			descripcion: null,
			categoria: null,
			tipo_venta: 'UNIDAD',
			precio: 0,
			activo: true
		};
	}

	onMount(() => {
		cargarProductos();
	});

	async function cargarProductos(): Promise<void> {
		cargandoProductos = true;
		mensajeError = '';

		try {
			productos = await obtenerProductos();
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudieron cargar los productos.'
			);
		} finally {
			cargandoProductos = false;
		}
	}

	async function guardarProducto(): Promise<void> {
		mensajeExito = '';
		mensajeError = '';

		const nombre = formulario.nombre.trim();
		const precio = Number(formulario.precio);

		if (!nombre) {
			mensajeError = 'El nombre del producto es obligatorio.';
			return;
		}

		if (!Number.isFinite(precio) || precio < 0) {
			mensajeError = 'El precio debe ser un número válido mayor o igual a cero.';
			return;
		}

		const datosProducto: ProductoInsert = {
			nombre,
			descripcion: normalizarTextoOpcional(formulario.descripcion),
			categoria: normalizarTextoOpcional(formulario.categoria),
			tipo_venta: formulario.tipo_venta,
			precio,
			activo: formulario.activo
		};

		guardandoProducto = true;

		try {
			if (productoEditandoId === null) {
				const productoCreado = await crearProducto(datosProducto);

				productos = ordenarProductos([
					...productos,
					productoCreado
				]);

				mensajeExito = 'Producto creado correctamente.';
			} else {
				const productoActualizado = await actualizarProducto(
					productoEditandoId,
					datosProducto
				);

				reemplazarProductoEnLista(productoActualizado);

				mensajeExito = 'Producto actualizado correctamente.';
			}

			cancelarEdicion();
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo guardar el producto.'
			);
		} finally {
			guardandoProducto = false;
		}
	}

	function comenzarEdicion(producto: Producto): void {
		productoEditandoId = producto.id_producto;

		formulario = {
			nombre: producto.nombre,
			descripcion: producto.descripcion,
			categoria: producto.categoria,
			tipo_venta: producto.tipo_venta,
			precio: producto.precio,
			activo: producto.activo
		};

		mensajeExito = '';
		mensajeError = '';

		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	function cancelarEdicion(): void {
		productoEditandoId = null;
		formulario = crearFormularioVacio();
	}

	async function alternarEstado(producto: Producto): Promise<void> {
		mensajeExito = '';
		mensajeError = '';
		procesandoProductoId = producto.id_producto;

		try {
			const productoActualizado = await cambiarEstadoProducto(
				producto.id_producto,
				!producto.activo
			);

			reemplazarProductoEnLista(productoActualizado);

			mensajeExito = productoActualizado.activo
				? 'Producto reactivado correctamente.'
				: 'Producto desactivado correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo modificar el estado del producto.'
			);
		} finally {
			procesandoProductoId = null;
		}
	}

	async function confirmarEliminacion(
		producto: Producto
	): Promise<void> {
		const confirmado = window.confirm(
			`¿Realmente deseas eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`
		);

		if (!confirmado) {
			return;
		}

		mensajeExito = '';
		mensajeError = '';
		procesandoProductoId = producto.id_producto;

		try {
			await eliminarProducto(producto.id_producto);

			productos = productos.filter(
				(item) => item.id_producto !== producto.id_producto
			);

			if (productoEditandoId === producto.id_producto) {
				cancelarEdicion();
			}

			mensajeExito = 'Producto eliminado correctamente.';
		} catch (error) {
			mensajeError = obtenerMensajeError(
				error,
				'No se pudo eliminar el producto.'
			);
		} finally {
			procesandoProductoId = null;
		}
	}

	function reemplazarProductoEnLista(
		productoActualizado: Producto
	): void {
		productos = ordenarProductos(
			productos.map((producto) =>
				producto.id_producto === productoActualizado.id_producto
					? productoActualizado
					: producto
			)
		);
	}

	function ordenarProductos(lista: Producto[]): Producto[] {
		return [...lista].sort((a, b) =>
			a.nombre.localeCompare(b.nombre)
		);
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

	<title>Productos</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
<a href="/" class="text-sm font-medium text-gray-600 hover:text-gray-900">
	← Volver al menú </a>
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">
				{productoEditandoId === null
					? 'Crear producto'
					: 'Editar producto'}
			</h1>

			<p class="mt-1 text-sm text-gray-600">
				{productoEditandoId === null
					? 'Registra un nuevo producto.'
					: 'Modifica la información del producto seleccionado.'}
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
				guardarProducto();
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
					for="categoria"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Categoría
				</label>

				<input
					id="categoria"
					type="text"
					bind:value={formulario.categoria}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div>
				<label
					for="tipoVenta"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Tipo de venta
				</label>

				<select
					id="tipoVenta"
					bind:value={formulario.tipo_venta}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				>
					<option value="UNIDAD">Unidad</option>
					<option value="PESO">Peso</option>
				</select>
			</div>

			<div>
				<label
					for="precio"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Precio
				</label>

				<input
					id="precio"
					type="number"
					min="0"
					step="0.01"
					bind:value={formulario.precio}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
				/>
			</div>

			<div class="md:col-span-2">
				<label
					for="descripcion"
					class="mb-1 block text-sm font-medium text-gray-700"
				>
					Descripción
				</label>

				<textarea
					id="descripcion"
					rows="3"
					bind:value={formulario.descripcion}
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
					Producto activo
				</label>
			</div>

			<div class="flex flex-col gap-3 md:col-span-2 sm:flex-row">
				<button
					type="submit"
					disabled={guardandoProducto}
					class="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if guardandoProducto}
						Guardando...
					{:else if productoEditandoId === null}
						Guardar producto
					{:else}
						Guardar cambios
					{/if}
				</button>

				{#if productoEditandoId !== null}
					<button
						type="button"
						onclick={cancelarEdicion}
						disabled={guardandoProducto}
						class="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100"
					>
						Cancelar edición
					</button>
				{/if}
			</div>
		</form>
	</section>

	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-5">
			<h2 class="text-xl font-bold text-gray-900">
				Productos registrados
			</h2>

			<p class="mt-1 text-sm text-gray-600">
				Total: {productos.length}
			</p>
		</div>

		{#if cargandoProductos}
			<p class="text-gray-600">Cargando productos...</p>
		{:else if productos.length === 0}
			<p class="text-gray-600">No hay productos registrados.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[850px] border-collapse text-left">
					<thead>
						<tr class="border-b border-gray-200 text-sm text-gray-600">
							<th class="px-3 py-3">Nombre</th>
							<th class="px-3 py-3">Categoría</th>
							<th class="px-3 py-3">Tipo</th>
							<th class="px-3 py-3">Precio</th>
							<th class="px-3 py-3">Estado</th>
							<th class="px-3 py-3 text-right">Acciones</th>
						</tr>
					</thead>

					<tbody>
						{#each productos as producto (producto.id_producto)}
							<tr
								class:opacity-60={!producto.activo}
								class="border-b border-gray-100"
							>
								<td class="px-3 py-4 font-medium text-gray-900">
									{producto.nombre}
								</td>

								<td class="px-3 py-4 text-gray-700">
									{producto.categoria ?? 'Sin categoría'}
								</td>

								<td class="px-3 py-4 text-gray-700">
									{producto.tipo_venta}
								</td>

								<td class="px-3 py-4 text-gray-700">
									${Number(producto.precio).toFixed(2)}
								</td>

								<td class="px-3 py-4">
									<span
										class="rounded-full px-2.5 py-1 text-xs font-medium"
										class:bg-green-100={producto.activo}
										class:text-green-800={producto.activo}
										class:bg-gray-200={!producto.activo}
										class:text-gray-700={!producto.activo}
									>
										{producto.activo ? 'Activo' : 'Inactivo'}
									</span>
								</td>

								<td class="px-3 py-4">
									<div class="flex justify-end gap-2">
										<button
											type="button"
											onclick={() => comenzarEdicion(producto)}
											disabled={procesandoProductoId === producto.id_producto}
											class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
										>
											Editar
										</button>

										<button
											type="button"
											onclick={() => alternarEstado(producto)}
											disabled={procesandoProductoId === producto.id_producto}
											class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
										>
											{producto.activo ? 'Desactivar' : 'Reactivar'}
										</button>

										<button
											type="button"
											onclick={() => confirmarEliminacion(producto)}
											disabled={procesandoProductoId === producto.id_producto}
											class="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
										>
											{procesandoProductoId === producto.id_producto
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