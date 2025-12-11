// carrito.js - Sistema de carrito compartido

let carrito = JSON.parse(localStorage.getItem('carrito')) || {};

function agregarAlCarrito(codigo, nombre, precio, cantidad) {
  if (cantidad <= 0) {
    eliminarDelCarrito(codigo);
    return;
  }
  
  carrito[codigo] = {
    nombre: nombre,
    precio: precio,
    cantidad: cantidad
  };
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
  renderizarCarrito();
}

function eliminarDelCarrito(codigo) {
  delete carrito[codigo];
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
  renderizarCarrito();
}

function actualizarBadgeCarrito() {
  const badge = document.getElementById('badgeCarrito');
  const totalItems = Object.keys(carrito).length;
  
  if (badge) {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }
}

function toggleCarrito() {
  const panel = document.getElementById('panelCarrito');
  const overlay = document.getElementById('overlay');
  
  if (panel && overlay) {
    const estaActivo = panel.classList.contains('activo');
    
    if (estaActivo) {
      panel.classList.remove('activo');
      overlay.classList.remove('activo');
    } else {
      panel.classList.add('activo');
      overlay.classList.add('activo');
      renderizarCarrito();
    }
  }
}

function renderizarCarrito() {
  const lista = document.getElementById('listaCarrito');
  const totalElement = document.getElementById('totalGeneral');
  
  if (!lista) return;
  
  // Recargar carrito desde localStorage
  carrito = JSON.parse(localStorage.getItem('carrito')) || {};
  const items = Object.entries(carrito);
  
  if (items.length === 0) {
    lista.innerHTML = '<div class="carrito-vacio">🛒 El carrito está vacío</div>';
    if (totalElement) totalElement.textContent = 'Total: S/ 0.00';
    return;
  }
  
  let total = 0;
  lista.innerHTML = items.map(([codigo, item]) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="carrito-item">
        <h4>${item.nombre}</h4>
        <div class="detalle">Código: ${codigo}</div>
        <div class="detalle">Cantidad: ${item.cantidad} × S/ ${item.precio.toFixed(2)}</div>
        <div class="subtotal">Subtotal: S/ ${subtotal.toFixed(2)}</div>
      </div>
    `;
  }).join('');
  
  if (totalElement) {
    totalElement.textContent = `Total: S/ ${total.toFixed(2)}`;
  }
}

async function enviarPedido() {
  const nombreCliente = document.getElementById('nombreCliente');
  
  if (!nombreCliente || !nombreCliente.value.trim()) {
    alert('Por favor ingrese el nombre del cliente');
    return;
  }
  
  // Recargar carrito desde localStorage
  carrito = JSON.parse(localStorage.getItem('carrito')) || {};
  const items = Object.entries(carrito);
  
  if (items.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  let total = 0;
  const productos = items.map(([codigo, item]) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return {
      codigo: codigo,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      subtotal: subtotal
    };
  });
  
  // Obtener vendedor si existe
  const userSession = JSON.parse(localStorage.getItem('userSession'));
  const vendedor = userSession ? userSession.nombre : null;
  
  const pedido = {
    cliente: nombreCliente.value.trim(),
    productos: productos,
    total: total,
    fecha: new Date().toISOString(),
    estado: 'pendiente',
    vendedor: vendedor
  };
  
  try {
    const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js');
    const { getApp } = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js');
    
    const app = getApp();
    const db = getFirestore(app);
    
    await addDoc(collection(db, 'pedidos'), pedido);
    
    alert('✅ Pedido enviado correctamente');
    
    // Limpiar carrito
    carrito = {};
    localStorage.removeItem('carrito');
    nombreCliente.value = '';
    
    // Actualizar interfaz
    actualizarBadgeCarrito();
    renderizarCarrito();
    toggleCarrito();
    
    // Resetear cantidades en la página actual
    document.querySelectorAll('.cantidad').forEach(span => {
      span.textContent = '0';
    });
    
  } catch (error) {
    console.error('Error al enviar pedido:', error);
    alert('❌ Error al enviar el pedido: ' + error.message);
  }
}

// Sincronizar cantidades de productos con el carrito al cargar la página
function sincronizarCantidades() {
  carrito = JSON.parse(localStorage.getItem('carrito')) || {};
  
  // Si hay una función de productos en la página
  if (typeof productos !== 'undefined') {
    productos.forEach((producto, index) => {
      const span = document.getElementById('cant' + index);
      if (span && carrito[producto.codigo]) {
        span.textContent = carrito[producto.codigo].cantidad;
      }
    });
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  carrito = JSON.parse(localStorage.getItem('carrito')) || {};
  actualizarBadgeCarrito();
  renderizarCarrito();
  sincronizarCantidades();
});

// Actualizar badge cuando cambia el localStorage (en otra pestaña)
window.addEventListener('storage', function(e) {
  if (e.key === 'carrito') {
    carrito = JSON.parse(e.newValue) || {};
    actualizarBadgeCarrito();
    renderizarCarrito();
    sincronizarCantidades();
  }
});
