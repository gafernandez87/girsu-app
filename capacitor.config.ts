import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.proyectojujuy.caminoresiduos',
  appName: 'El Camino de los Residuos',
  webDir: 'dist/el-camino-residuos/browser',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;

