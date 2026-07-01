// Admin Portal JavaScript

let productsData = [];
let pricesData = [];
let plansData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
	checkAdminAccess();
});

// Check if user has admin access
async function checkAdminAccess() {
	try {
		const response = await fetch('/api/admin/check-access');
		const data = await response.json();
		
		if (response.ok && data.is_admin) {
			document.querySelector('.admin-content').style.display = 'block';
			document.querySelector('.access-denied').style.display = 'none';
			loadAllData();
		} else {
			document.querySelector('.admin-content').style.display = 'none';
			document.querySelector('.access-denied').style.display = 'flex';
		}
	} catch (error) {
		console.error('Access check failed:', error);
		document.querySelector('.admin-content').style.display = 'none';
		document.querySelector('.access-denied').style.display = 'flex';
	}
}

// Load all data
async function loadAllData() {
	await Promise.all([
		loadProducts(),
		loadPrices(),
		loadPlans()
	]);
}

// Load Stripe products
async function loadProducts() {
	const container = document.getElementById('products-list');
	
	try {
		const response = await fetch('/api/admin/products');
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to load products');
		
		productsData = data.products || [];
		renderProductsTable(productsData);
	} catch (error) {
		container.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
	}
}

// Load Stripe prices
async function loadPrices() {
	const container = document.getElementById('prices-list');
	
	try {
		const response = await fetch('/api/admin/prices');
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to load prices');
		
		pricesData = data.prices || [];
		renderPricesTable(pricesData);
		updatePriceSelects();
	} catch (error) {
		container.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
	}
}

// Load local subscription plans
async function loadPlans() {
	const container = document.getElementById('plans-list');
	
	try {
		const response = await fetch('/api/admin/plans');
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to load plans');
		
		plansData = data.plans || [];
		renderPlansTable(plansData);
	} catch (error) {
		container.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
	}
}

// Render products table
function renderProductsTable(products) {
	const container = document.getElementById('products-list');
	
	if (!products || products.length === 0) {
		container.innerHTML = '<div class="empty-state">No products found. Create one to get started.</div>';
		return;
	}
	
	let html = `
		<table class="admin-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
					<th>Description</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
	`;
	
	for (const product of products) {
		html += `
			<tr>
				<td class="id-cell" title="${product.id}">${product.id}</td>
				<td><strong>${escapeHtml(product.name)}</strong></td>
				<td>${escapeHtml(product.description || '-')}</td>
				<td>
					<span class="status-badge ${product.active ? 'active' : 'inactive'}">
						${product.active ? 'Active' : 'Inactive'}
					</span>
				</td>
				<td class="actions">
					<button class="btn-icon" onclick="editProduct('${product.id}')" title="Edit">✏️</button>
					<button class="btn-icon" onclick="copyToClipboard('${product.id}')" title="Copy ID">📋</button>
				</td>
			</tr>
		`;
	}
	
	html += '</tbody></table>';
	container.innerHTML = html;
	
	// Update product select dropdowns
	updateProductSelects();
}

// Render prices table
function renderPricesTable(prices) {
	const container = document.getElementById('prices-list');
	
	if (!prices || prices.length === 0) {
		container.innerHTML = '<div class="empty-state">No prices found. Create one to get started.</div>';
		return;
	}
	
	let html = `
		<table class="admin-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Product</th>
					<th>Amount</th>
					<th>Type</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
	`;
	
	for (const price of prices) {
		const amount = formatCurrency(price.unit_amount, price.currency);
		const interval = price.recurring ? `/${price.recurring.interval}` : ' one-time';
		const productName = price.product?.name || price.product?.id || '-';
		
		html += `
			<tr>
				<td class="id-cell" title="${price.id}">${price.id}</td>
				<td>${escapeHtml(productName)}</td>
				<td class="price-display">${amount}${interval}</td>
				<td>${price.recurring ? 'Recurring' : 'One-time'}</td>
				<td>
					<span class="status-badge ${price.active ? 'active' : 'inactive'}">
						${price.active ? 'Active' : 'Inactive'}
					</span>
				</td>
				<td class="actions">
					<button class="btn-icon ${price.active ? 'danger' : ''}" 
							onclick="togglePriceActive('${price.id}', ${!price.active})" 
							title="${price.active ? 'Deactivate' : 'Activate'}">
						${price.active ? '🚫' : '✅'}
					</button>
					<button class="btn-icon" onclick="copyToClipboard('${price.id}')" title="Copy ID">📋</button>
				</td>
			</tr>
		`;
	}
	
	html += '</tbody></table>';
	container.innerHTML = html;
}

// Render plans table
function renderPlansTable(plans) {
	const container = document.getElementById('plans-list');
	
	if (!plans || plans.length === 0) {
		container.innerHTML = '<div class="empty-state">No local plans found. Sync a Stripe price to create one.</div>';
		return;
	}
	
	let html = `
		<table class="admin-table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Stripe Price ID</th>
					<th>Monthly Builds</th>
					<th>API Access</th>
					<th>API Keys</th>
					<th>Price</th>
				</tr>
			</thead>
			<tbody>
	`;
	
	for (const plan of plans) {
		html += `
			<tr>
				<td><strong>${escapeHtml(plan.name)}</strong></td>
				<td>${escapeHtml(plan.description || '-')}</td>
				<td class="id-cell" title="${plan.stripe_price_id || '-'}">${plan.stripe_price_id || '-'}</td>
				<td>${plan.monthly_builds === -1 ? 'Unlimited' : plan.monthly_builds}</td>
				<td>
					<span class="status-badge ${plan.api_access ? 'active' : 'inactive'}">
						${plan.api_access ? 'Yes' : 'No'}
					</span>
				</td>
				<td>${plan.max_api_keys === -1 ? 'Unlimited' : plan.max_api_keys}</td>
				<td class="price-display">${formatCurrency(plan.price_cents, 'usd')}/mo</td>
			</tr>
		`;
	}
	
	html += '</tbody></table>';
	container.innerHTML = html;
}

// Update product select dropdowns
function updateProductSelects() {
	const select = document.getElementById('price-product');
	if (!select) return;
	
	select.innerHTML = '<option value="">Select a product...</option>';
	for (const product of productsData) {
		if (product.active) {
			select.innerHTML += `<option value="${product.id}">${escapeHtml(product.name)}</option>`;
		}
	}
}

// Update price select dropdowns for sync modal
function updatePriceSelects() {
	const select = document.getElementById('sync-price-id');
	if (!select) return;
	
	select.innerHTML = '<option value="">Select a price...</option>';
	for (const price of pricesData) {
		if (price.active) {
			const amount = formatCurrency(price.unit_amount, price.currency);
			const productName = price.product?.name || 'Unknown';
			const interval = price.recurring ? `/${price.recurring.interval}` : '';
			select.innerHTML += `<option value="${price.id}">${productName} - ${amount}${interval}</option>`;
		}
	}
}

// Modal functions
function showCreateProductModal() {
	document.getElementById('create-product-form').reset();
	document.getElementById('create-product-modal').style.display = 'flex';
}

function showCreatePriceModal() {
	document.getElementById('create-price-form').reset();
	document.getElementById('create-price-modal').style.display = 'flex';
}

function showSyncPlanModal() {
	document.getElementById('sync-plan-form').reset();
	updatePriceSelects();
	document.getElementById('sync-plan-modal').style.display = 'flex';
}

function closeModal(modalId) {
	document.getElementById(modalId).style.display = 'none';
}

function editProduct(productId) {
	const product = productsData.find(p => p.id === productId);
	if (!product) return;
	
	document.getElementById('edit-product-id').value = product.id;
	document.getElementById('edit-product-name').value = product.name;
	document.getElementById('edit-product-description').value = product.description || '';
	document.getElementById('edit-product-active').checked = product.active;
	document.getElementById('edit-product-modal').style.display = 'flex';
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
	if (e.target.classList.contains('modal-overlay')) {
		e.target.style.display = 'none';
	}
});

// Form submissions
async function createProduct(e) {
	e.preventDefault();
	
	const form = e.target;
	const formData = new FormData(form);
	
	try {
		const response = await fetch('/api/admin/products/create', {
			method: 'POST',
			body: formData
		});
		
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to create product');
		
		showToast('Product created successfully', 'success');
		closeModal('create-product-modal');
		loadProducts();
	} catch (error) {
		showToast(error.message, 'error');
	}
}

async function createPrice(e) {
	e.preventDefault();
	
	const form = e.target;
	const formData = new FormData(form);
	
	try {
		const response = await fetch('/api/admin/prices/create', {
			method: 'POST',
			body: formData
		});
		
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to create price');
		
		showToast('Price created successfully', 'success');
		closeModal('create-price-modal');
		loadPrices();
	} catch (error) {
		showToast(error.message, 'error');
	}
}

async function updateProduct(e) {
	e.preventDefault();
	
	const form = e.target;
	const formData = new FormData(form);
	
	// Handle checkbox
	if (!document.getElementById('edit-product-active').checked) {
		formData.set('active', 'false');
	}
	
	try {
		const response = await fetch('/api/admin/products/update', {
			method: 'POST',
			body: formData
		});
		
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to update product');
		
		showToast('Product updated successfully', 'success');
		closeModal('edit-product-modal');
		loadProducts();
	} catch (error) {
		showToast(error.message, 'error');
	}
}

async function togglePriceActive(priceId, active) {
	const action = active ? 'activate' : 'deactivate';
	if (!confirm(`Are you sure you want to ${action} this price?`)) return;
	
	const formData = new FormData();
	formData.append('price_id', priceId);
	formData.append('active', active.toString());
	
	try {
		const response = await fetch('/api/admin/prices/update', {
			method: 'POST',
			body: formData
		});
		
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to update price');
		
		showToast(`Price ${action}d successfully`, 'success');
		loadPrices();
	} catch (error) {
		showToast(error.message, 'error');
	}
}

async function syncPlan(e) {
	e.preventDefault();
	
	const form = e.target;
	const formData = new FormData(form);
	
	// Handle checkbox
	if (!document.getElementById('sync-api-access').checked) {
		formData.set('api_access', 'false');
	}
	
	try {
		const response = await fetch('/api/admin/plans/sync', {
			method: 'POST',
			body: formData
		});
		
		const data = await response.json();
		
		if (!response.ok) throw new Error(data.message || 'Failed to sync plan');
		
		showToast('Plan synced successfully', 'success');
		closeModal('sync-plan-modal');
		loadPlans();
	} catch (error) {
		showToast(error.message, 'error');
	}
}

// Utility functions
function formatCurrency(cents, currency) {
	if (!cents) return '$0.00';
	const amount = cents / 100;
	const symbol = { usd: '$', eur: '€', gbp: '£' }[currency] || '$';
	return symbol + amount.toFixed(2);
}

function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function copyToClipboard(text) {
	navigator.clipboard.writeText(text).then(() => {
		showToast('Copied to clipboard', 'success');
	}).catch(() => {
		showToast('Failed to copy', 'error');
	});
}

function showToast(message, type = 'info') {
	const existing = document.querySelector('.toast');
	if (existing) existing.remove();
	
	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	toast.textContent = message;
	document.body.appendChild(toast);
	
	setTimeout(() => toast.remove(), 3000);
}
