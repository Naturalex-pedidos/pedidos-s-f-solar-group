// carrito.js - Sistema de carrito compartido

let carrito = JSON.parse(localStorage.getItem('carrito')) || {};

// Agregar o actualizar producto en el carrito
function agregarAlCarrito(codigo, nombre, precio, cantidad) {
  carrito[codigo] = {
    nombre: nombre,
    precio: precio,
    cantidad: cantidad
  };
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
  renderizarCarrito();
}

// Eliminar producto del carrito
function eliminarDelCarrito(codigo) {
  delete carrito[codigo];
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
  renderizarCarrito();
}

// Actualizar el badge del carrito (número de productos)
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

// Toggle para abrir/cerrar el carrito lateral
function toggleCarrito() {
  const panel = document.getElementById('panelCarrito');
  const overlay = document.getElementById('overlay');
  
  if (panel && overlay) {
    panel.classList.toggle('activo');
    overlay.classList.toggle('activo');
    renderizarCarrito();
  }
}

// Renderizar contenido del carrito
function renderizarCarrito() {
  const lista = document.getElementById('listaCarrito');
  const totalElement = document.getElementById('totalGeneral');
  
  if (!lista) return;
  
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

// Enviar pedido a Firebase
async function enviarPedido() {
  const nombreCliente = document.getElementById('nombreCliente');
  
  if (!nombreCliente || !nombreCliente.value.trim()) {
    alert('Por favor ingrese el nombre del cliente');
    return;
  }
  
  const items = Object.entries(carrito);
  
  if (items.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  // Calcular total
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
  
  const pedido = {
    cliente: nombreCliente.value.trim(),
    productos: productos,
    total: total,
    fecha: new Date().toISOString(),
    estado: 'pendiente'
  };
  
  try {
    // Importar Firebase (asegúrate de tener la configuración correcta)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Tu configuración de Firebase (REEMPLAZA CON TU CONFIG)
    const firebaseConfig = {
      apiKey: "TU_API_KEY",
      authDomain: "TU_AUTH_DOMAIN",
      projectId: "TU_PROJECT_ID",
      storageBucket: "TU_STORAGE_BUCKET",
      messagingSenderId: "TU_MESSAGING_SENDER_ID",
      appId: "TU_APP_ID"
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Guardar en Firestore
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

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  actualizarBadgeCarrito();
  renderizarCarrito();
});
