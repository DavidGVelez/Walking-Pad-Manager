# Walking Pad Manager

App móvil creada con React Native y Expo para gestionar una walking pad.

## Requisitos

- Node.js 20 o superior
- npm
- Expo development build para probar Bluetooth en dispositivo físico

## Instalación

```bash
npm install
```

## Desarrollo

Esta app usa Bluetooth Low Energy con `react-native-ble-plx`. Esa librería necesita código nativo, por lo que el enlace Bluetooth no funciona dentro de Expo Go estándar.

Para arrancar Metro con el development client:

```bash
npm start
```

Para crear e instalar un development build local:

```bash
npm run ios
npm run android
```

Para probar solo la UI con Expo Go, sin Bluetooth:

```bash
npm run start:expo-go
```

## Bluetooth

La pantalla principal incluye un panel para:

- Solicitar permisos Bluetooth.
- Escanear dispositivos cercanos con nombres parecidos a Mobvoi, WT, Fit, Walking o Treadmill.
- Conectar con la Mobvoi WT Fit.
- Listar servicios y características BLE detectadas.

El control real de start, stop y velocidad se implementará cuando tengamos identificados los UUIDs y comandos correctos de la cinta.

## Estructura

```text
.
├── App.tsx
├── app.json
├── src
│   ├── bluetooth
│   │   └── walkingPadBle.ts
│   ├── hooks
│   │   └── useWalkingPadBle.ts
│   ├── screens
│   │   └── HomeScreen.tsx
│   └── theme.ts
└── package.json
```
