# Plantin Frontend

Aplicación web frontend para el sistema de gestión Plantin. Desarrollada con React, TypeScript, Tailwind CSS y Vite.

## Características

- 🔐 **Autenticación**: Sistema de login seguro
- 📱 **Responsive**: Optimizada para móviles y desktop
- 🛍️ **Gestión de Productos**: Crear, listar y buscar productos
- 💰 **Control de Ventas**: Registrar y administrar ventas
- 💳 **Métodos de Pago**: Configurar diferentes formas de pago
- 🎨 **UI Moderna**: Interfaz limpia y profesional con Tailwind CSS
- ⚡ **Rápida**: Desarrollada con Vite para un desarrollo ágil

## Tecnologías

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de desarrollo y construcción
- **Tailwind CSS** - Framework de CSS utilitario
- **React Router** - Enrutamiento del lado del cliente
- **React Query** - Gestión de estado del servidor
- **React Hook Form** - Manejo de formularios
- **Zustand** - Gestión de estado global
- **Axios** - Cliente HTTP
- **Zod** - Validación de esquemas

## Prerequisitos

- Node.js 18+ 
- npm o yarn
- Backend de Plantin ejecutándose en `http://localhost:8000`

## Instalación

1. **Instalar dependencias**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno** (opcional):
   ```bash
   # Crear archivo .env en la carpeta frontend
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la construcción de producción
- `npm run lint` - Ejecuta ESLint para revisar el código

## Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── api/               # Cliente HTTP y endpoints
│   ├── components/        # Componentes reutilizables
│   ├── pages/            # Páginas principales
│   ├── store/            # Gestión de estado global
│   ├── types/            # Definiciones de tipos TypeScript
│   ├── utils/            # Utilidades
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── package.json
├── tailwind.config.js    # Configuración de Tailwind
├── tsconfig.json         # Configuración de TypeScript
└── vite.config.ts        # Configuración de Vite
```

## Uso

### Autenticación

1. Accede a la aplicación en `http://localhost:3000`
2. Usa las credenciales de tu usuario para iniciar sesión
3. Una vez autenticado, tendrás acceso a todas las funcionalidades

### Gestión de Productos

- **Crear productos**: Haz clic en "Nuevo Producto" y completa el formulario
- **Buscar productos**: Usa la barra de búsqueda para filtrar por nombre o código
- **Ver detalles**: Los productos se muestran en una tabla con toda la información

### Registro de Ventas

- **Nueva venta**: Haz clic en "Nueva Venta"
- **Agregar productos**: Especifica el ID del producto y la cantidad
- **Múltiples productos**: Usa "Agregar Producto" para incluir varios items
- **Método de pago**: Selecciona el ID del método de pago a usar

### Métodos de Pago

- **Configurar métodos**: Crea diferentes formas de pago (efectivo, tarjeta, etc.)
- **Descuentos**: Asigna descuentos automáticos por método de pago
- **Estado**: Activa o desactiva métodos según sea necesario

## Configuración del Proxy

El frontend está configurado para hacer proxy de las llamadas `/api/*` al backend en `http://localhost:8000` cuando se ejecuta localmente.

Para desarrollo con Docker Compose, el proxy se configura automáticamente.

Si necesitas cambiar la URL del backend, modifica `vite.config.ts` o la variable de entorno `VITE_API_BASE_URL`.

## Construcción para Producción

Para producción se utiliza AWS. El build se maneja automáticamente en el pipeline de despliegue.

Para desarrollo local, simplemente usa:
```bash
npm run dev
```

## Funcionalidades Responsive

La aplicación está optimizada para funcionar en:

- 📱 **Móviles**: Menú hamburguesa, layouts adaptables
- 💻 **Tablets**: Diseño optimizado para pantallas medianas  
- 🖥️ **Desktop**: Sidebar fijo, tablas expansivas

## Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa que el backend esté ejecutándose correctamente
2. Verifica que las URLs de la API sean las correctas
3. Revisa la consola del navegador para errores de JavaScript
4. Asegúrate de que todas las dependencias estén instaladas

## Contribución

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request 