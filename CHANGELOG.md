# Changelog - Frontend Plantin

## [1.1.0] - 2024-01-30

### ✨ Nuevas Características

#### Formulario de Ventas Mejorado
- **Campo Precio Final**: Agregado campo opcional para especificar el precio total de la venta
- **Selector de Productos**: Reemplazado campo manual por selector con búsqueda en tiempo real
- **Selector de Métodos de Pago**: Reemplazado campo manual por selector con búsqueda
- **UI Mejorada**: Mejor organización visual de los productos en el formulario

#### Componentes Nuevos
- `ProductSelector`: Componente reutilizable para selección de productos con búsqueda
- `PaymentMethodSelector`: Componente reutilizable para selección de métodos de pago

#### API Endpoints
- Agregado endpoint para listar métodos de pago con búsqueda
- Mejoras en tipos TypeScript para métodos de pago

### 🔧 Mejoras Técnicas

#### Formulario de Ventas
```typescript
// Antes
payment_method_id: número manual
product_id: número manual

// Ahora  
payment_method_id: selector con búsqueda
product_id: selector con búsqueda + información adicional
price: campo opcional para precio final
```

#### UX/UI
- **Búsqueda en tiempo real** en selectores
- **Información contextual** (stock, precios, descuentos)
- **Diseño responsive** optimizado
- **Validación mejorada** con mensajes claros

### 🎯 Funcionalidades

#### Selector de Productos
- ✅ Búsqueda por nombre o código
- ✅ Muestra precio actual y stock disponible
- ✅ Interfaz dropdown con scroll
- ✅ Validación automática

#### Selector de Métodos de Pago  
- ✅ Búsqueda por nombre
- ✅ Muestra descuentos disponibles
- ✅ Solo métodos activos
- ✅ Indicadores visuales de descuentos

#### Precio Final
- ✅ Campo opcional para override manual
- ✅ Validación de números positivos
- ✅ Soporte para decimales

### 📱 Responsive Design
- **Mobile**: Selectores optimizados para touch
- **Tablet**: Layout adaptado para pantallas medianas
- **Desktop**: Aprovecha el espacio disponible

### 🔄 Migración

Si ya tienes el proyecto corriendo:

```bash
# Detener servicios
docker-compose down

# Reconstruir con nuevos componentes
docker-compose up --build
```

Los formularios existentes seguirán funcionando, solo se mejorará la experiencia de usuario.

---

## [1.0.0] - 2024-01-29

### 🚀 Lanzamiento Inicial
- Aplicación React + TypeScript completa
- Sistema de autenticación
- Gestión de productos, ventas y métodos de pago
- Diseño responsive con Tailwind CSS
- Integración con Docker Compose 