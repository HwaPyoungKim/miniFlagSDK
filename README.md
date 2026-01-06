# Feature Flags Mini SDK by HwaPyoungKim

Un SDK minimalista, Feature Flag orientado a la produccion en TypeScript

## Objetivos a cumplir
La idea principal es desarrollar un sistema simple pero escalable de feat flags.
    - Arquitectura limpia
    - Diseño de SDK interno
    - Diseño escalable
    - Manejo de errores

## Unit Testing
Este projecto incluye unit tests on la **capa de dominio**, especificamente el "flagResolver".
El resolver es una pieza de lógica **pura y determinística** (no realiza llamadas HTTP, no depende de React ni de cache), lo que lo convierte en un candidato ideal para tests rápidos y confiables.

### ¿Por qué testear el resolver?
Los sistemas de feature flags se basan en **reglas de decisión** (precedencia, fallbacks, variantes).  
Los tests unitarios garantizan que cambios en la implementación no rompan el comportamiento esperado y, además, documentan claramente dichas reglas.

En este proyecto, los tests verifican:

- **Precedencia:** la configuración `remote` tiene prioridad sobre los `defaults`
- **Fallback seguro:** cuando una flag no existe, el sistema falla de forma segura (feature deshabilitada)
- **Defaults:** si una flag no está presente en `remote`, se utilizan los valores por defecto
- **Variantes (regla opcional):** si una flag está deshabilitada, las variantes se consideran inactivas

### Herramientas
Dado que el proyecto utiliza **Vite + React + TypeScript**, los tests están implementados con **Vitest**, una herramienta liviana que se integra de forma natural con Vite.

### Ubicación de los tests
Los tests se colocan junto al código de dominio para mantener claridad y coherencia:

src/
sdk/
domain/
resolver.ts
resolver.test.ts


### Cómo ejecutar los tests

Ejecutar tests en modo watch:

```bash
npm test

