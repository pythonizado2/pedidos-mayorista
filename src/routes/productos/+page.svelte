<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Productos | Pedidos Mayorista</title>
</svelte:head>

<main class="min-h-screen bg-slate-100 p-4">
	<section class="mx-auto max-w-xl">
		<header class="mb-4">
			<h1 class="text-2xl font-bold text-slate-900">Productos</h1>
			<p class="text-sm text-slate-600">
				Listado de productos disponibles.
			</p>
		</header>

		{#if data.error}
			<div class="rounded-lg bg-red-100 p-4 text-red-800">
				{data.error}
			</div>
		{:else if data.productos.length === 0}
			<div class="rounded-lg bg-white p-4 shadow">
				No hay productos disponibles.
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.productos as producto}
					<article class="rounded-xl bg-white p-4 shadow">
						<div class="flex items-start justify-between gap-4">
							<div>
								<h2 class="font-semibold text-slate-900">
									{producto.nombre}
								</h2>

								<p class="text-sm text-slate-500">
									{producto.categoria ?? 'Sin categoría'}
								</p>
							</div>

							<strong class="whitespace-nowrap text-blue-700">
								${Number(producto.precio).toFixed(2)}
							</strong>
						</div>

						<p class="mt-2 text-sm text-slate-600">
							Venta por:
							{producto.tipo_venta === 'PESO'
								? 'kilogramo'
								: 'unidad'}
						</p>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</main>