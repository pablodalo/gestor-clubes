# Cómo acceder al portal del socio

## Como admin del club (o superadmin entrando al club)

1. **Desde el panel del club:** en el menú lateral, en "Gestión del club" → **Portal del socio**. Abre la página de login del portal.
2. **Desde la ficha de un socio:** botón **"Abrir portal del socio"** (arriba a la derecha). Abre el login del portal en una nueva pestaña.

**URL directa:** `https://[tu-dominio]/portal/socios/[slug-del-club]/login`

El socio ingresa con el **email y contraseña** de la cuenta que le creaste en la pestaña "Cuenta de acceso" de su ficha.

## Como superadmin (platform)

1. **Desde Platform → Tenants:** entrá al tenant (club) y en la parte superior hacé clic en **"Portal del socio"**. Se abre el login del portal de ese club.
2. **Para ver el portal como socio:** necesitás un socio con cuenta creada. Creá uno desde el panel del club (Socios → Nuevo socio), luego en la ficha del socio andá a la pestaña "Cuenta de acceso", creá la cuenta (email + contraseña) y usá esos datos en `/portal/socios/[slug]/login`.

No hay "impersonación": el superadmin ve la misma pantalla de login que el socio; para ver el contenido del portal hay que iniciar sesión con un usuario socio.
